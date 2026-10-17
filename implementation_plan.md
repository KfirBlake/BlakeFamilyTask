# Implementation Plan: Master Task Bank & Weekly Kanban Allocation Board

## 1. Feature Architecture Overview

The goal is to decouple reusable task definitions from active date-bound tasks, eliminating repetitive weekly entry for parents.

```mermaid
graph TD
    A[Master Task Bank (master_task_bank)] -->|Drag & Drop Allocation| B[Draft Weekly Schedule (Local State)]
    B -->|Select Days & Stars Override| B
    B -->|Click 'Apply Weekly Schedule'| C[Batch Execution Engine]
    C -->|Calculate Dates & Deduplicate| D[Active Tasks (tasks table)]
    D --> E[Child Weekly Task Dashboard]
```

### Key Pillars
1. **Master Task Bank (`master_task_bank` table):** A persistent library of general chore templates belonging to the family (not bound to any child or date).
2. **Weekly Kanban Allocation Board:** An interactive workspace where parents drag templates from the Bank into child columns, specifying which day(s) of the week (`Sun`–`Sat`) the task should be performed.
3. **Weekly Batch Execution Engine:** A batch processor that converts the weekly draft into concrete date-stamped records in `tasks`, applying deduplication so re-applying updates existing tasks instead of creating duplicates.

---

## 2. Database Schema Design

### 2.1 Table: `public.master_task_bank`

```sql
create table public.master_task_bank (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid references public.families(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  default_stars integer default 5 not null check (default_stars >= 1),
  icon_key text, -- emoji, 'lucide:IconName', or uploaded image URL
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Row Level Security (RLS)
* **Enable RLS:** `alter table public.master_task_bank enable row level security;`
* **Select Policy:** Any authenticated family member can view templates in their family:
  ```sql
  create policy "View master task bank in family"
    on public.master_task_bank for select
    using (family_id = public.get_my_family_id());
  ```
* **Manage Policy:** Parents and admin parents can insert, update, and delete templates:
  ```sql
  create policy "Parents manage master task bank"
    on public.master_task_bank for all
    using (
      family_id = public.get_my_family_id()
      and public.get_my_role() in ('admin_parent', 'parent')
    )
    with check (
      family_id = public.get_my_family_id()
      and public.get_my_role() in ('admin_parent', 'parent')
    );
  ```

### 2.2 Updating `public.tasks` Table

To link generated tasks back to the template without modifying the legacy `template_id` (used by recurring tasks), we add `master_task_id`:

```sql
alter table public.tasks 
  add column if not exists master_task_id uuid references public.master_task_bank(id) on delete set null;

-- Partial unique index for deduplication:
-- Guarantees that applying the same template to the same child on the same calendar date is idempotent
create unique index if not exists idx_tasks_master_child_date 
  on public.tasks (master_task_id, assigned_to, due_date) 
  where master_task_id is not null;
```

---

## 3. Component & Routing Architecture

### 3.1 Dedicated Route Structure & Sidebar Navigation
Instead of bloating `/dashboard/tasks` with tabs, each feature lives in its own dedicated Next.js App Router route, following the pattern used in `/dashboard/rewards`:

* **`src/app/dashboard/tasks/page.tsx` (`/dashboard/tasks`):**
  - Child Weekly View (existing [WeeklyChildTaskCalendar.tsx](file:///c:/develop/family-task/src/components/tasks/WeeklyChildTaskCalendar.tsx)).
  - Includes a quick-link banner/button for parents: "מעבר לתכנון שבועי" (Go to Weekly Planning).
* **`src/app/dashboard/tasks/bank/page.tsx` (`/dashboard/tasks/bank`):**
  - Dedicated page for **Master Task Bank (בנק משימות)**.
  - Role-gated: visible to parents and admin parents.
* **`src/app/dashboard/tasks/planning/page.tsx` (`/dashboard/tasks/planning`):**
  - Dedicated page for **Weekly Kanban Allocation Board (תכנון שבועי)**.
  - Role-gated: visible to parents and admin parents.

#### Sidebar Integration ([Sidebar.tsx](file:///c:/develop/family-task/src/components/dashboard/Sidebar.tsx))
Add first-class sidebar navigation items for parents:
- `משימות` (`/dashboard/tasks`, icon: `CheckSquare`)
- `תכנון שבועי` (`/dashboard/tasks/planning`, icon: `CalendarRange` / `Kanban`)
- `בנק משימות` (`/dashboard/tasks/bank`, icon: `FolderKanban` / `BookOpen`)

### 3.2 Master Task Bank Page & Components (`src/app/dashboard/tasks/bank/`)
- **`src/app/dashboard/tasks/bank/page.tsx`:** Dedicated page loading `TaskBankCatalog`.
- **`src/components/tasks/bank/TaskBankCatalog.tsx`:**
  - Header toolbar with search input, stars filter, and "משימה חדשה לבנק" button.
  - Grid of card components:
    - Icon / Image thumbnail via [IconRenderer.tsx](file:///c:/develop/family-task/src/components/ui/IconRenderer.tsx)
    - Title (max 50 chars)
    - Default star value pill badge
    - Description preview (collapsible/truncated)
    - Edit and Delete quick action buttons
- **`src/components/tasks/bank/TaskTemplateModal.tsx`:**
  - Form dialog for creating/updating a template in `master_task_bank`.
  - Reuses [IconPicker.tsx](file:///c:/develop/family-task/src/components/ui/IconPicker.tsx) (emojis, Lucide icons, image upload to `task-icons` Supabase bucket).
  - Validation: title required ($\le 50$ chars), default stars required ($\ge 1$, default $5$).

### 3.3 Weekly Kanban Allocation Board Page & Components (`src/app/dashboard/tasks/planning/`)
- **`src/app/dashboard/tasks/planning/page.tsx`:** Dedicated planning workspace loading `WeeklyAllocationBoard`.
- **`src/components/tasks/kanban/WeeklyAllocationBoard.tsx`:** Container managing week navigation and draft schedule state.
- **`BoardHeaderBar.tsx`:**
  - Week navigator (Prev / Next week, defaults to current/upcoming week).
  - Date interval format: `Oct 11, 2026 – Oct 17, 2026` (Hebrew date formatting).
  - Family total stars counter across all children.
- **`TaskBankColumn.tsx` (Source Column):**
  - Left/Right column listing all templates from `master_task_bank`.
  - In-column search bar.
  - Cards with drag handle, title, icon, and default stars.
- **`ChildAllocationColumn.tsx` (Destination Columns):**
  - One column per child in the family.
  - Header: child avatar, name, and total scheduled stars counter for this week.
  - Drop zone container with visual hover highlighting.
  - List of currently drafted task cards for this child:
    - Task title and icon.
    - Day chips (e.g. `[א, ב, ג]` or `כל השבוע`).
    - Allocated star badge.
    - Click to edit days / change star value.
    - Relocate to another child or delete (return to bank).
- **`DayAssignmentPopover.tsx`:**
  - Displayed immediately upon dropping a card onto a child or clicking a card to edit.
  - Checkboxes for all 7 days: `ראשון (Sun)`, `שני (Mon)`, `שלישי (Tue)`, `רביעי (Wed)`, `חמישי (Thu)`, `שישי (Fri)`, `שבת (Sat)`.
  - Quick preset buttons:
    - **כל יום (Everyday):** Days 0..6
    - **ימי חול (Weekdays):** Days 0..4 (Sun–Thu)
    - **סופ״ש (Weekend):** Days 5..6 (Fri–Sat)
  - Star value override input (defaults to template's `default_stars`).

### 3.4 Drag-and-Drop Implementation (`@dnd-kit`)
- Powered by **`@dnd-kit/core`** and **`@dnd-kit/utilities`**:
  - **Sensors:** Configured with `PointerSensor` (with distance activation constraint, e.g. 5px) and `TouchSensor` (with press delay / tolerance, e.g. 200ms delay + 5px tolerance) so mobile users can scroll vertically normally, but hold-and-drag activates smooth drag gestures natively.
  - **Collision Detection:** `rectIntersection` / `closestCenter` for accurate multi-column drop target detection.
  - **`DragOverlay`:** Renders a floating duplicate of the dragged card with elevation shadow, subtle scale ($1.04$), and tilt for modern physics.
  - **Native Mobile & Tablet Support:** First-class touch drag interaction without relying on workarounds or click-only menus.

---

## 4. Batch Execution Engine & Deduplication Logic

### 4.1 Draft State Structure
```typescript
interface WeeklyDraftAllocation {
  id: string // local draft unique ID
  master_task_id: string
  child_id: string
  title: string
  icon_key: string | null
  description: string | null
  stars_value: number
  selected_days: number[] // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
}
```

### 4.2 Application Flow
1. User clicks **"החל לוח שבועי (Apply Weekly Schedule)"**.
2. For each allocation in the draft:
   - For each day index in `selected_days`:
     - Calculate target date: `due_date = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd')`
     - Prepare task record:
       ```typescript
       {
         family_id: familyId,
         created_by: currentUserId,
         assigned_to: child_id,
         title: allocation.title,
         description: allocation.description,
         icon_key: allocation.icon_key,
         stars_value: allocation.stars_value,
         due_date: due_date,
         status: 'pending',
         master_task_id: allocation.master_task_id
       }
       ```
3. **Deduplication Enforcement (Upsert):**
   - Execute batch upsert into Supabase `tasks`:
     ```typescript
     await supabase
       .from('tasks')
       .upsert(tasksToUpsert, {
         onConflict: 'master_task_id,assigned_to,due_date'
       })
     ```
   - If an existing task for that template, child, and date exists, its star value, title, and icon are updated without creating a duplicate record or resetting completed statuses.
4. **Post-Apply Actions:**
   - Display full-screen progress indicator during save.
   - Show Sonner success toast: `"הלוח השבועי הוחל בהצלחה!"`.
   - Invalidate React Query keys: `['tasks']`, `['familyOverview']`.

---

## 5. Verification & Testing Strategy

1. **Database Schema Verification:**
   - Query `information_schema` and `pg_policies` to verify `master_task_bank` structure, constraints, and RLS policies.
   - Verify `tasks.master_task_id` and unique index.
2. **Master Task Bank Testing:**
   - Create 3 sample templates with different icon types (emoji, Lucide icon, and custom upload).
   - Test search filtering, editing star values, and deleting templates.
3. **Weekly Allocation Board Testing:**
   - Test dragging templates to 2 different children.
   - Test day presets: "כל יום", "ימי חול", "סופ״ש", and custom selections.
   - Test star override for a specific child.
   - Test moving a card between children and removing back to bank.
4. **Batch Apply & Deduplication Testing:**
   - Apply weekly schedule and verify that tasks appear in [WeeklyChildTaskCalendar.tsx](file:///c:/develop/family-task/src/components/tasks/WeeklyChildTaskCalendar.tsx).
   - Change days/stars and click "Apply" again $\rightarrow$ verify records are updated in place with zero duplicate rows.

---

# Implementation Plan: Reward Requests Cancellation & Return (Child & Parent)

## 1. Feature Overview & Business Logic

When a child requests a reward from the Rewards Store (`rewards_store`), their stars are immediately deducted from `profiles.stars_balance`, and a record in `reward_purchases` is created with status `'pending'`.

Currently, parents can only mark the pending request as `redeemed`. If a child requests a reward by mistake, or if a parent cannot fulfill the requested reward, there is no way to cancel the request and restore the child's star points.

This feature introduces two complementary actions:
1. **Child Action — Cancel Pending Request:**
   - Child can cancel their own pending request directly from `/child/rewards`.
   - The status updates to `'cancelled'` and their spent stars are refunded back to `profiles.stars_balance`.
2. **Parent Action — Return / Reject Pending Request:**
   - Parent can reject/return a child's pending reward request from `/dashboard/rewards/pending`.
   - The status updates to `'rejected'` and the reward's cost in stars is refunded back to the child's `profiles.stars_balance`.

```mermaid
graph TD
    A[Child Buys Reward] -->|Deduct Stars & Set status='pending'| B[reward_purchases record]
    B -->|Child clicks 'בטל בקשה'| C[RPC: cancel_reward_purchase]
    B -->|Parent clicks 'החזר / דחה'| D[RPC: reject_reward_purchase]
    B -->|Parent swipes to redeem| E[Status='redeemed']

    C -->|Set status='cancelled' & Refund Stars| F[Child Balance Restored]
    D -->|Set status='rejected' & Refund Stars| F
```

---

## 2. Database Schema & Atomic Stored Procedures

### 2.1 Update Status Check Constraint on `reward_purchases`
Currently: `CHECK (status = ANY (ARRAY['pending'::text, 'redeemed'::text]))`
Updated to:
```sql
ALTER TABLE public.reward_purchases 
  DROP CONSTRAINT IF EXISTS reward_purchases_status_check;

ALTER TABLE public.reward_purchases 
  ADD CONSTRAINT reward_purchases_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'redeemed'::text, 'cancelled'::text, 'rejected'::text]));
```

### 2.2 Row Level Security (RLS) Policy
Allow children to update their own pending purchases:
```sql
CREATE POLICY "Children can cancel own pending purchases"
  ON public.reward_purchases FOR UPDATE
  USING (
    child_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    child_id = auth.uid()
    AND status = 'cancelled'
  );
```

### 2.3 Atomic Postgres RPCs (Single Transaction & Security Definer)
Using database RPCs guarantees atomicity (status change + star refund in one transaction) and overcomes RLS permission limitations (where non-admin parents cannot update other profiles):

1. **`public.cancel_reward_purchase(p_purchase_id uuid)`:**
   - Validates that caller is the child (`child_id = auth.uid()`).
   - Validates that purchase `status = 'pending'`.
   - Retrieves reward price from `rewards_store`.
   - Updates `reward_purchases` status to `'cancelled'`.
   - Updates `profiles.stars_balance = stars_balance + price` for `child_id`.
   - Returns `{ success: true, refunded_stars: price, new_balance: balance }`.

2. **`public.reject_reward_purchase(p_purchase_id uuid)`:**
   - Validates that caller is a `parent` or `admin_parent` within the same family as the purchase.
   - Validates that purchase `status = 'pending'`.
   - Retrieves `child_id` and reward price.
   - Updates `reward_purchases` status to `'rejected'`.
   - Updates `profiles.stars_balance = stars_balance + price` for `child_id`.
   - Returns `{ success: true, refunded_stars: price, child_id: child_id }`.

---

## 3. Frontend Implementation

### 3.1 Child UI: `src/app/child/rewards/page.tsx`
- In `purchases` query, include `price` from `rewards_store (id, name, icon_key, description, price)`.
- In the **"המתנות שלי 🎁"** $\rightarrow$ **"ממתין למימוש"** list:
  - Add a **"בטל בקשה"** button with a trash/undo icon.
  - On click, show a confirmation prompt: `"האם לבטל את ההזמנה של {reward_name}? {price} כוכבים יוחזרו לחשבונך."`
  - On confirm, call `supabase.rpc('cancel_reward_purchase', { p_purchase_id: purchase.id })`.
  - Invalidate queries: `['profiles', 'balance', userId]` and `['reward_purchases', userId]`.
  - Display success feedback banner: `"ההזמנה בוטלה ו-{refunded_stars} כוכבים הוחזרו לחשבונך!"`.

### 3.2 Parent UI: `src/app/dashboard/rewards/pending/page.tsx`
- On each pending reward card:
  - Add a **"החזר / דחה"** button (styled with red outline/soft-red background and undo/X icon) next to the `SwipeToComplete` slider.
  - On click, display a confirmation modal:
    - `"האם לדחות את בקשת הפרס של {child_name}?"`
    - Subtitle: `"{price} כוכבים יוחזרו באופן מיידי ליתרת הכוכבים של הילד."`
  - On confirm, call `supabase.rpc('reject_reward_purchase', { p_purchase_id: p.id })`.
  - Invalidate queries: `['reward_purchases']` and `['familyOverview']`.
  - Display success feedback notification.

### 3.3 Parent History: `src/app/dashboard/rewards/history/page.tsx`
- Broaden the query from `.eq('status', 'redeemed')` to `.in('status', ['redeemed', 'rejected', 'cancelled'])`.
- Add a status filter: `[הכל, מומש, נדחה והוחזר, בוטל ע״י הילד]`.
- Display colored status badges on each history card:
  - `redeemed`: Green badge ("מומש")
  - `rejected`: Red/Orange badge ("נדחה והוחזר")
  - `cancelled`: Gray badge ("בוטל ע״י הילד")

---

## 4. Verification & Testing Checklist
1. **Child Cancellation Flow:**
   - Child with 50 stars purchases a 15-star reward $\rightarrow$ balance becomes 35, request appears in "ממתין למימוש".
   - Child clicks "בטל בקשה" and confirms $\rightarrow$ request disappears from pending, balance immediately updates back to 50 stars.
2. **Parent Return/Reject Flow:**
   - Child purchases a 20-star reward $\rightarrow$ balance drops by 20.
   - Parent visits `/dashboard/rewards/pending` $\rightarrow$ sees the pending reward $\rightarrow$ clicks "החזר / דחה" and confirms.
   - Request is removed from pending, child receives 20 stars back immediately.
3. **Security & State Protection:**
   - Cannot cancel or reject an already redeemed request.
   - Child cannot cancel another child's request.
   - Non-family member cannot reject requests.
   - Zero double-refund race conditions due to atomic DB transaction.

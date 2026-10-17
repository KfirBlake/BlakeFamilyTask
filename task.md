# Project Task Breakdown: Master Task Bank & Weekly Kanban Allocation Board

## Overview
Decouple task templates from individual child tasks by creating a Master Task Bank (`master_task_bank`), an interactive Drag-and-Drop Weekly Kanban Allocation Board for parents, and a Weekly Batch Execution Engine that applies date-bound tasks to child dashboards with deduplication.

---

## Steps & Sub-tasks

- [x] **Step 1: Database Migration & Supabase Setup** *(COMPLETED)*
  - [x] 1.1 Create migration file `supabase/migrations/20261010000000_create_master_task_bank.sql`
  - [x] 1.2 Define table `master_task_bank` (`id`, `family_id`, `created_by`, `title`, `description`, `default_stars`, `icon_key`, `created_at`, `updated_at`)
  - [x] 1.3 Add Row Level Security (RLS) policies for `master_task_bank` (Family members read; parents/admin_parents insert, update, delete)
  - [x] 1.4 Add `master_task_id` column to `public.tasks` referencing `master_task_bank(id)` with `ON DELETE SET NULL`
  - [x] 1.5 Add partial unique index `idx_tasks_master_child_date` on `public.tasks (master_task_id, assigned_to, due_date) WHERE master_task_id IS NOT NULL`
  - [x] 1.6 Apply migration to remote Supabase database and verify schema & RLS via SQL/MCP
  - *Definition of Done (Step 1):*
    - `master_task_bank` exists in Supabase with RLS enabled.
    - `tasks.master_task_id` exists and unique partial index is applied.
    - Verified that existing `task_templates` and legacy recurring tasks remain completely untouched.

---

- [x] **Step 2: Master Task Bank Dedicated Page & Modal (`/dashboard/tasks/bank`)** *(COMPLETED)*
  - [x] 2.1 Build `TaskTemplateModal.tsx` form component:
    - `title` (Required, string, max 50 chars)
    - `default_stars` (Required, number, min 1, default 5)
    - `icon_key` (Optional, reusing existing `IconPicker` for emojis, Lucide icons, and uploaded images)
    - `description` (Optional textarea)
  - [x] 2.2 Build `TaskBankCatalog.tsx`:
    - Top toolbar with search filter input and "Create New Template" primary button
    - Responsive card grid displaying icon/image, title, star badge, description preview, and Edit/Delete buttons
    - Confirm prompt and delete handler
  - [x] 2.3 Create dedicated page `src/app/dashboard/tasks/bank/page.tsx`
  - [x] 2.4 Add "בנק משימות" item to `Sidebar.tsx` (visible for parents/admin_parents)
  - [x] 2.5 Wire up React Query mutations and hooks for `master_task_bank` CRUD
  - *Definition of Done (Step 2):*
    - Parents can navigate to `/dashboard/tasks/bank` via the sidebar.
    - Parents can view, search, create, edit, and delete templates in the Master Task Bank.
    - All fields (title, stars, icon/image, description) persist accurately in `master_task_bank`.
    - Page is responsive, styled with Tailwind CSS, and matches project design standards.

---

- [x] **Step 3: Weekly Kanban Allocation Board Dedicated Page (`/dashboard/tasks/planning`) with `@dnd-kit`** *(COMPLETED)*
  - [x] 3.1 Install and configure `@dnd-kit/core` and `@dnd-kit/utilities`
  - [x] 3.2 Create dedicated page `src/app/dashboard/tasks/planning/page.tsx`
  - [x] 3.3 Build `WeeklyAllocationBoard.tsx` header bar:
    - Week selector with Prev / Next navigation (defaults to upcoming/current week)
    - Formatted date range indicator (e.g. `Oct 11, 2026 – Oct 17, 2026`)
    - Total weekly stars summary counter across all children
  - [x] 3.4 Build Source Column: "Master Task Bank":
    - Scrollable list of templates from `master_task_bank`
    - In-column search/filter input
    - Draggable template cards using `useDraggable`
  - [x] 3.5 Build Destination Columns: "Children Boards":
    - One column per child profile in the family
    - Column header with child avatar, name, and child's total weekly scheduled stars
    - Droppable target container using `useDroppable`
    - Cards displaying title, icon, assigned day chips, star badge, edit days trigger, and remove button
  - [x] 3.6 Build `DayAssignmentPopover.tsx` (opens on drop or card click):
    - Day checkboxes: `[Sun, Mon, Tue, Wed, Thu, Fri, Sat]` (Hebrew: `[א, ב, ג, ד, ה, ו, ש]`)
    - Quick presets: "Everyday" (Sun–Sat), "Weekdays" (Sun–Thu), "Weekend" (Fri–Sat)
    - Optional star override input
  - [x] 3.7 Configure `@dnd-kit` sensors & `DragOverlay`:
    - `PointerSensor` & `TouchSensor` with delay/distance thresholds for seamless mobile touch dragging
    - Animated `DragOverlay` preview with lift effect and elevation shadow
    - Drop detection (Bank $\rightarrow$ Child, Child $\rightarrow$ Child, Child $\rightarrow$ Bank)
  - [x] 3.8 Implement local draft state (`Draft Schedule`):
    - All allocations remain in local state until explicitly applied
  - *Definition of Done (Step 3):*
    - Parents can navigate to `/dashboard/tasks/planning` via the sidebar.
    - Drag & Drop powered by `@dnd-kit` works smoothly with animations and native touch drag on mobile/tablet.
    - Live star counters per child and family header update instantly.
    - Draft state is completely manageable and responsive across all screen sizes.

---

- [x] **Step 4: Batch Apply Engine & Deduplication** *(COMPLETED)*
  - [x] 4.1 Build `StickyActionBar.tsx`:
    - Summary label: `"X tasks scheduled across Y children"`
    - "Apply Weekly Schedule" primary button
    - "Reset Draft" secondary button
  - [x] 4.2 Build batch processing service / Server Action:
    - Iterate over draft allocations and calculate exact dates: `assigned_date = addDays(weekStart, dayIndex)`
    - Construct `tasks` payload (`family_id`, `created_by`, `assigned_to`, `title`, `description`, `icon_key`, `stars_value`, `due_date`, `status: 'pending'`, `master_task_id`)
    - Enforce deduplication: upsert on `(master_task_id, assigned_to, due_date)` updating star value, title, and icon without duplicating rows
  - [x] 4.3 Add full-screen loading overlay during batch execution
  - [x] 4.4 Trigger Sonner success toast and invalidate React Query caches (`['tasks']`, `['familyOverview']`)
  - [x] 4.5 Provide option/button to view the updated Child Dashboard
  - *Definition of Done (Step 4):*
    - Clicking "Apply Weekly Schedule" creates real tasks for children for that week.
    - Applying a second time with modified days or stars updates existing tasks without creating duplicates.
    - Child weekly view immediately shows the new tasks with correct dates and stars.

---

- [ ] **Step 5: End-to-End Testing & Polish**
  - [ ] 5.1 End-to-end verification of Template creation $\rightarrow$ Kanban allocation $\rightarrow$ Batch apply $\rightarrow$ Child task execution
  - [ ] 5.2 Verify deduplication edge cases (changing days, re-applying, removing)
  - [ ] 5.3 Polish animations, RTL layout alignment, and empty/loading states
  - [ ] 5.4 Update `walkthrough.md` with verification guide and screenshots
  - *Definition of Done (Step 5):*
    - Full workflow works seamlessly without errors or console warnings.
    - User signoff and verification.

---

# Feature: Reward Requests Cancellation & Return (Child & Parent)

## Steps & Sub-tasks

- [x] **Step 6: Database Migration & Atomic Stored Procedures** *(COMPLETED)*
  - [x] 6.1 Create migration file `supabase/migrations/20261018000000_reward_cancellation_and_return.sql`
  - [x] 6.2 Update `reward_purchases` status check constraint to include `'cancelled'` and `'rejected'`
  - [x] 6.3 Update RLS policies on `reward_purchases` allowing children to update their own pending requests to `'cancelled'`
  - [x] 6.4 Create transactional Postgres RPC `public.cancel_reward_purchase(p_purchase_id uuid)` with `SECURITY DEFINER` (validates child ownership, updates status to `cancelled`, and refunds stars to child `stars_balance`)
  - [x] 6.5 Create transactional Postgres RPC `public.reject_reward_purchase(p_purchase_id uuid)` with `SECURITY DEFINER` (validates parent family membership, updates status to `rejected`, and refunds stars to child `stars_balance`)
  - [x] 6.6 Apply migration to Supabase and verify RPC functions and constraints via SQL

- [x] **Step 7: Child UI - Cancel Pending Reward Request** *(COMPLETED)*
  - [x] 7.1 Update `src/app/child/rewards/page.tsx` query to fetch reward price for pending purchases
  - [x] 7.2 Add "בטל בקשה" (Cancel Request) button on pending reward cards in "המתנות שלי"
  - [x] 7.3 Add confirmation dialog informing the child that their stars will be refunded
  - [x] 7.4 Connect action to `cancel_reward_purchase` RPC with optimistic update & cache invalidation (`profiles`, `reward_purchases`)
  - [x] 7.5 Show feedback banner/toast confirming cancellation and stars returned

- [x] **Step 8: Parent UI - Return / Reject Reward Request in Pending Approvals** *(COMPLETED)*
  - [x] 8.1 Update `src/app/dashboard/rewards/pending/page.tsx` to include "החזר מתנה / דחה" button alongside the redeem action
  - [x] 8.2 Add confirmation modal displaying the child name and star points that will be refunded
  - [x] 8.3 Connect action to `reject_reward_purchase` RPC with loading state and cache invalidation
  - [x] 8.4 Display success notification confirming stars refund and request rejection

- [x] **Step 9: History & Status Visibility** *(COMPLETED)*
  - [x] 9.1 Update `src/app/dashboard/rewards/history/page.tsx` to display and filter by all resolved statuses (`redeemed`, `rejected`, `cancelled`) with clear Hebrew badges
  - [x] 9.2 Update `src/app/child/rewards/page.tsx` to show cancelled/rejected history if desired, or keep "כבר מימשתי" clean

- [ ] **Step 10: Testing & Verification** *(USER WILL PERFORM)*
  - [ ] 10.1 Verify Child Cancel flow: purchase reward $\rightarrow$ balance drops $\rightarrow$ cancel pending request $\rightarrow$ status becomes `cancelled` $\rightarrow$ balance restored
  - [ ] 10.2 Verify Parent Reject flow: child purchases reward $\rightarrow$ parent clicks "החזר / דחה" $\rightarrow$ status becomes `rejected` $\rightarrow$ child balance restored
  - [ ] 10.3 Verify non-pending protection (cannot cancel or reject already redeemed items)
  - [x] 10.4 Verify TypeScript compilation (`tsc --noEmit`) and UI responsiveness

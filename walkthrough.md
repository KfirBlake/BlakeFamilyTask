# Walkthrough: Master Task Bank & Weekly Kanban Allocation

## Step 1: Database Migration & Supabase Setup (Completed)

### What Was Done
1. **Migration File Created:**
   - [20261010000000_create_master_task_bank.sql](file:///c:/develop/family-task/supabase/migrations/20261010000000_create_master_task_bank.sql)
2. **Table `public.master_task_bank` Created:**
   - `id` (uuid, primary key, default `uuid_generate_v4()`)
   - `family_id` (uuid, foreign key to `families(id)` on delete cascade)
   - `created_by` (uuid, foreign key to `profiles(id)` on delete set null)
   - `title` (text, not null)
   - `description` (text, nullable)
   - `default_stars` (integer, default `5`, check `default_stars >= 1`)
   - `icon_key` (text, nullable, supports emoji, `lucide:<icon>`, or uploaded image URL)
   - `created_at` (timestamptz, default `timezone('utc'::text, now())`)
   - `updated_at` (timestamptz, default `timezone('utc'::text, now())`)
3. **Row Level Security (RLS) Policies Implemented:**
   - `View master task bank in family`: All family members (`family_id = public.get_my_family_id()`).
   - `Parents insert master task bank`: Parents & Admin Parents (`get_my_role() in ('admin_parent', 'parent')`).
   - `Parents update master task bank`: Parents & Admin Parents.
   - `Parents delete master task bank`: Parents & Admin Parents.
4. **Linked to `public.tasks` Table:**
   - Added column `master_task_id` (uuid, references `master_task_bank(id)` on delete set null).
5. **Deduplication Partial Unique Index Created:**
   - `idx_tasks_master_child_date` on `public.tasks (master_task_id, assigned_to, due_date) WHERE master_task_id IS NOT NULL`.
   - Guarantees idempotent batch apply operations.
6. **Safety & Backward Compatibility Verified:**
   - Existing `task_templates` table and all 24 existing records remain 100% untouched.

---

### Verification Results
| Check | Query / Test | Status |
|---|---|---|
| `master_task_bank` columns | `information_schema.columns` query | All 9 columns present with defaults |
| RLS Policies | `pg_policies` query | 4 active policies (SELECT, INSERT, UPDATE, DELETE) |
| `tasks.master_task_id` | `information_schema.columns` query | Column created as nullable UUID |
| Partial Unique Index | `pg_indexes` query | `idx_tasks_master_child_date` active |
| Legacy `task_templates` | `SELECT count(*)` | All 24 records preserved |

---

### How to Verify Manually
You can verify the new table and index in Supabase SQL Editor with:
```sql
-- 1. Check table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'master_task_bank';

-- 2. Check deduplication index on tasks
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE indexname = 'idx_tasks_master_child_date';
```

---

## Step 2: Master Task Bank Dedicated Page & Modal (Completed)

### What Was Done
1. **Created `TaskTemplateModal.tsx`:**
   - Location: [src/components/tasks/bank/TaskTemplateModal.tsx](file:///c:/develop/family-task/src/components/tasks/bank/TaskTemplateModal.tsx)
   - Supports creating and editing task templates in `master_task_bank`.
   - Fields: `title` (max 50 chars with counter), `default_stars` (min 1, default 5), `description` (optional), and `icon_key` using existing [IconPicker.tsx](file:///c:/develop/family-task/src/components/ui/IconPicker.tsx) (emojis, Lucide icons, custom image upload).
2. **Created `TaskBankCatalog.tsx`:**
   - Location: [src/components/tasks/bank/TaskBankCatalog.tsx](file:///c:/develop/family-task/src/components/tasks/bank/TaskBankCatalog.tsx)
   - Features top toolbar with instant search/filter by title or description and item counter.
   - Responsive card grid displaying icon/image, title, star badge, description preview, and Edit/Delete action buttons.
   - Banner linking directly to the Weekly Planning board (`/dashboard/tasks/planning`).
   - Integrated with React Query (`['master_task_bank', familyId]`) with automatic cache invalidation and Sonner toasts.
3. **Created Dedicated Page (`/dashboard/tasks/bank`):**
   - Location: [src/app/dashboard/tasks/bank/page.tsx](file:///c:/develop/family-task/src/app/dashboard/tasks/bank/page.tsx)
4. **Updated Sidebar Navigation:**
   - Location: [src/components/dashboard/Sidebar.tsx](file:///c:/develop/family-task/src/components/dashboard/Sidebar.tsx)
   - Added `תכנון שבועי` (`CalendarRange`) and `בנק משימות` (`FolderKanban`) as first-class parent navigation items.
5. **Updated Tasks Dashboard:**
   - Location: [src/app/dashboard/tasks/page.tsx](file:///c:/develop/family-task/src/app/dashboard/tasks/page.tsx)
   - Added quick-access buttons in the header leading to `תכנון שבועי` and `בנק משימות`.

---

### Verification Results
| Check | Test | Status |
|---|---|---|
| Route Compilation (`/dashboard/tasks/bank`) | HTTP GET request | Returned `200 OK` |
| Route Compilation (`/dashboard/tasks`) | HTTP GET request | Returned `200 OK` |
| Sidebar Navigation | Component inspection | Displays `בנק משימות` and `תכנון שבועי` for parents |
| TaskTemplateModal | Code inspection | Validates $\le 50$ chars title, $\ge 1$ stars, integrates `IconPicker` |

---

### How to Verify Manually
1. Open your browser and navigate to `http://localhost:3000/dashboard/tasks/bank`.
2. Notice the new "בנק משימות" item in the sidebar.
3. Click "משימה חדשה לבנק" – the modal opens with icon picker, title, default stars, and description.
4. Add a sample template (e.g. "סידור החדר", 5 stars, 🛏️) – it appears immediately in the grid.
5. Try searching or editing the template.

---

## Step 3: Weekly Kanban Allocation Board Dedicated Page (`/dashboard/tasks/planning`) with `@dnd-kit` (Completed)

### What Was Done
1. **Installed & Integrated `@dnd-kit`:**
   - Packages installed: `@dnd-kit/core` (`^6.3.1`), `@dnd-kit/utilities` (`^3.2.2`).
   - Configured `PointerSensor` (distance: 5px) and `TouchSensor` (delay: 200ms, tolerance: 5px) to enable native drag on touch screens without interfering with normal vertical page scrolling.
   - Built smooth `DragOverlay` showing floating preview card with elevation shadow, tilt, and scale while dragging.
2. **Created Kanban Components:**
   - [DayAssignmentModal.tsx](file:///c:/develop/family-task/src/components/tasks/kanban/DayAssignmentModal.tsx): Popover/modal for post-drop or click editing with day checkboxes (`[א׳..ש׳]`), quick presets ("כל יום", "ימי חול א׳-ה׳", "סופ״ש ו׳-ש׳"), stars override, and total star calculation.
   - [DraggableBankCard.tsx](file:///c:/develop/family-task/src/components/tasks/kanban/DraggableBankCard.tsx): Bank template card with `useDraggable`, grab handle, title, icon, default stars, and tap-to-assign fallback.
   - [DraggableAllocatedCard.tsx](file:///c:/develop/family-task/src/components/tasks/kanban/DraggableAllocatedCard.tsx): Child assigned card with `useDraggable`, day badges, stars per day, weekly total stars, edit days button, and remove action.
   - [DroppableChildColumn.tsx](file:///c:/develop/family-task/src/components/tasks/kanban/DroppableChildColumn.tsx): Destination column with `useDroppable`, child avatar, total weekly stars pill, and glowing drop indicator.
   - [DroppableBankColumn.tsx](file:///c:/develop/family-task/src/components/tasks/kanban/DroppableBankColumn.tsx): Source column with in-column search and drop-to-remove target.
   - [WeeklyAllocationBoard.tsx](file:///c:/develop/family-task/src/components/tasks/kanban/WeeklyAllocationBoard.tsx): Master container with week selector (Prev/Next/Current), Hebrew date range indicator, live draft stats ribbon, multi-column Drag & Drop, and local draft state.
3. **Created Dedicated Page (`/dashboard/tasks/planning`):**
   - Location: [src/app/dashboard/tasks/planning/page.tsx](file:///c:/develop/family-task/src/app/dashboard/tasks/planning/page.tsx)
   - Tested and verified HTTP 200 OK.

---

### Verification Results
| Check | Test | Status |
|---|---|---|
| Package Installation | `package.json` | `@dnd-kit/core` and `@dnd-kit/utilities` installed |
| Route Compilation (`/dashboard/tasks/planning`) | HTTP GET request | Returned `200 OK` |
| Multi-column Drag & Drop | `@dnd-kit` DndContext & Sensors | Pointer + Touch sensors configured |
| Day Selection & Presets | Modal inspection | Everyday, Weekdays (Sun-Thu), Weekend (Fri-Sat), Custom days |
| Relocation & Deletion | DndContext handlers | Child $\rightarrow$ Child moves task; Child $\rightarrow$ Bank removes task |

---

### How to Verify Manually
1. Open your browser and navigate to `http://localhost:3000/dashboard/tasks/planning`.
2. Observe the week navigation bar (e.g. `11 באוקטובר – 17 באוקטובר 2026`) and summary counters.
3. Drag a task from the **בנק משימות** column and drop it into a child's column.
4. The Day Assignment popover opens immediately. Select days or click a preset (e.g., "ימי חול") and confirm.
5. Notice the card is added to the child's board with day badges and the star counter updates instantly.
6. Drag the assigned card to another child $\rightarrow$ it moves to the new child.
7. Drag the card back to the Bank column (or click the trash icon) $\rightarrow$ it is removed from the draft.

---

## Step 4: Batch Apply Engine & Deduplication (Completed)

### What Was Done
1. **Created `StickyActionBar.tsx`:**
   - Location: [src/components/tasks/kanban/StickyActionBar.tsx](file:///c:/develop/family-task/src/components/tasks/kanban/StickyActionBar.tsx)
   - Fixed to the bottom of the viewport with blur backdrop.
   - Live counters: number of drafted tasks, number of targeted children, total weekly stars, and daily task instance count.
   - Primary action: **"החל לוח שבועי"** (prominent indigo styling with loading state).
   - Secondary action: **"איפוס טיוטה"** (with confirmation prompt).
   - Direct link to view the live Child Tasks Calendar (`/dashboard/tasks`).
2. **Database Constraint & Upsert Optimization:**
   - Applied unique constraint `uq_tasks_master_child_date UNIQUE (master_task_id, assigned_to, due_date)` on `public.tasks`.
   - Updated migration file [supabase/migrations/20261010000000_create_master_task_bank.sql](file:///c:/develop/family-task/supabase/migrations/20261010000000_create_master_task_bank.sql).
3. **Batch Execution & Deduplication Logic:**
   - Location: [src/components/tasks/kanban/WeeklyAllocationBoard.tsx](file:///c:/develop/family-task/src/components/tasks/kanban/WeeklyAllocationBoard.tsx)
   - Iterates through the draft allocations and converts each selected day index to an exact date: `due_date = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd')`.
   - Executes atomic batch upsert:
     ```typescript
     await supabase
       .from('tasks')
       .upsert(tasksToUpsert, {
         onConflict: 'master_task_id,assigned_to,due_date'
       })
     ```
   - Re-applying the board updates existing records without creating duplicate rows.
4. **Preloading & State Hydration:**
   - When switching weeks or opening the planning board, queries existing scheduled tasks for that week and hydrates the draft allocations automatically.
5. **Feedback & Polish:**
   - Added full-screen loading overlay during batch generation.
   - Celebratory confetti animation on successful application.
   - Cache invalidation across `['tasks']`, `['familyOverview']`, and `['profiles']`.

---

### Verification Results
| Check | Test | Status |
|---|---|---|
| PostgreSQL Constraint | `uq_tasks_master_child_date` SQL test | Verified ON CONFLICT resolution |
| Sticky Action Bar | Component rendering | Live counters & buttons visible |
| Route Compilation | HTTP GET request | Returned `200 OK` |
| Idempotency / Deduplication | Schema & Upsert logic | Prevents duplicate records on same date |

---

### How to Verify Manually
1. Go to `http://localhost:3000/dashboard/tasks/planning`.
2. Drag 1 or 2 tasks from the Bank to a child and select days (e.g. Sunday to Tuesday).
3. Observe the bottom sticky action bar update with: `"X משימות מתוזמנות עבור Y ילדים"`.
4. Click **"החל לוח שבועי"**:
   - You will see the full-screen loading overlay.
   - Confetti triggers upon success, with a toast notification.
5. Navigate to `/dashboard/tasks` or click "צפייה בלוח השבועי":
   - The child's weekly calendar now shows the assigned tasks on Sunday, Monday, and Tuesday.
6. Return to `/dashboard/tasks/planning`:
   - Change the star value or add Wednesday, and click **"החל לוח שבועי"** again.
   - Check `/dashboard/tasks`: tasks are updated in place with zero duplicates!




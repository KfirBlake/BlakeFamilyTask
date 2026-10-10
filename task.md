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

- [ ] **Step 3: Weekly Kanban Allocation Board Dedicated Page (`/dashboard/tasks/planning`)**
  - [ ] 3.1 Create dedicated page `src/app/dashboard/tasks/planning/page.tsx` and add "תכנון שבועי" to `Sidebar.tsx` (parents only)
  - [ ] 3.2 Build `WeeklyAllocationBoard.tsx` header bar:
    - Week selector with Prev / Next navigation (defaults to upcoming/current week)
    - Formatted date range indicator (e.g. `Oct 11, 2026 – Oct 17, 2026`)
    - Total weekly stars summary counter across all children
  - [ ] 3.3 Build Source Column: "Master Task Bank":
    - Scrollable list of templates from `master_task_bank`
    - In-column search/filter input
    - Draggable template cards
  - [ ] 3.4 Build Destination Columns: "Children Boards":
    - One column per child profile in the family
    - Column header with child avatar, name, and child's total weekly scheduled stars
    - Drop zone for dragged cards
    - Cards displaying title, icon, assigned day chips, star badge, edit days trigger, and remove button
  - [ ] 3.5 Build `DayAssignmentPopover.tsx` (opens on drop or card click):
    - Day checkboxes: `[Sun, Mon, Tue, Wed, Thu, Fri, Sat]` (Hebrew: `[א, ב, ג, ד, ה, ו, ש]`)
    - Quick presets: "Everyday" (Sun–Sat), "Weekdays" (Sun–Thu), "Weekend" (Fri–Sat)
    - Optional star override input
  - [ ] 3.6 Implement Drag-and-Drop flow & mobile accessibility:
    - Drag card from Bank $\rightarrow$ Drop on Child $\rightarrow$ Select days in popover
    - Move card between children
    - Remove card from child back to bank
    - Mobile-friendly click-to-assign fallback
  - [ ] 3.7 Implement local draft state (`Draft Schedule`):
    - All allocations remain in local state until explicitly applied
  - *Definition of Done (Step 3):*
    - Parents can navigate to `/dashboard/tasks/planning` via the sidebar.
    - Parents can drag/assign any template to any child for any selection of days.
    - Live star counters per child and family header update instantly.
    - Draft state is completely manageable and responsive on both desktop and mobile.

---

- [ ] **Step 4: Batch Apply Engine & Deduplication**
  - [ ] 4.1 Build `StickyActionBar.tsx`:
    - Summary label: `"X tasks scheduled across Y children"`
    - "Apply Weekly Schedule" primary button
    - "Reset Draft" secondary button
  - [ ] 4.2 Build batch processing service / Server Action:
    - Iterate over draft allocations and calculate exact dates: `assigned_date = addDays(weekStart, dayIndex)`
    - Construct `tasks` payload (`family_id`, `created_by`, `assigned_to`, `title`, `description`, `icon_key`, `stars_value`, `due_date`, `status: 'pending'`, `master_task_id`)
    - Enforce deduplication: upsert on `(master_task_id, assigned_to, due_date)` updating star value, title, and icon without duplicating rows
  - [ ] 4.3 Add full-screen loading overlay during batch execution
  - [ ] 4.4 Trigger Sonner success toast and invalidate React Query caches (`['tasks']`, `['familyOverview']`)
  - [ ] 4.5 Provide option/button to view the updated Child Dashboard
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

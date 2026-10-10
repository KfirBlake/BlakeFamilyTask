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


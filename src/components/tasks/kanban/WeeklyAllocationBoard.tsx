'use client'

import { useState, useMemo, useEffect } from 'react'
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    pointerWithin,
    rectIntersection,
    CollisionDetection,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    format,
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks,
    isSameWeek,
    addDays,
    getDay,
    parseISO,
} from 'date-fns'
import { he } from 'date-fns/locale'
import {
    ChevronRight,
    ChevronLeft,
    Calendar,
    Star,
    Sparkles,
    RotateCcw,
    CheckCircle2,
    CalendarRange,
    Users,
    Loader2,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { useUserPreferences } from '@/contexts/UserContext'
import DroppableBankColumn from './DroppableBankColumn'
import DroppableChildColumn, { ChildProfile } from './DroppableChildColumn'
import DayAssignmentModal from './DayAssignmentModal'
import { DraftAllocation } from './DraggableAllocatedCard'
import { MasterTaskTemplate } from '../bank/TaskTemplateModal'
import IconRenderer from '@/components/ui/IconRenderer'
import TaskTemplateModal from '../bank/TaskTemplateModal'
import StickyActionBar from './StickyActionBar'

export default function WeeklyAllocationBoard() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const supabase = createClient()
    const { userId, familyId } = useUserPreferences()

    // Current week calculation (starts on Sunday = 0)
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
        startOfWeek(new Date(), { weekStartsOn: 0 })
    )

    // Draft allocations state: array of scheduled tasks mapped to children
    const [draftAllocations, setDraftAllocations] = useState<DraftAllocation[]>([])
    const [isApplying, setIsApplying] = useState(false)

    // Active item being dragged for DragOverlay
    const [activeDragItem, setActiveDragItem] = useState<{
        type: 'bank-template' | 'allocated-task'
        data: MasterTaskTemplate | DraftAllocation
    } | null>(null)

    // Modal state for day & star assignment
    const [assignmentModalState, setAssignmentModalState] = useState<{
        isOpen: boolean
        childId: string
        childName: string
        template: MasterTaskTemplate
        allocationId?: string // Present if editing existing allocation
        initialDays?: number[]
        initialStars?: number
    }>({
        isOpen: false,
        childId: '',
        childName: '',
        template: {} as MasterTaskTemplate,
    })

    // Create Template modal in bank
    const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false)

    // Quick Assign selection modal for click-to-assign on touch devices
    const [quickAssignTemplate, setQuickAssignTemplate] = useState<MasterTaskTemplate | null>(null)

    // Week boundaries
    const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 })
    const isThisWeek = isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 0 })
    const weekStartStr = format(weekStart, 'yyyy-MM-dd')
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd')

    // 1. Fetch family children profiles
    const { data: children = [], isLoading: loadingChildren } = useQuery<ChildProfile[]>({
        queryKey: ['profiles', 'children', familyId],
        queryFn: async () => {
            if (!familyId) return []
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('family_id', familyId)
                .eq('role', 'child')
                .order('created_at', { ascending: true })

            if (error) console.error('Error fetching children:', error)
            return data || []
        },
        enabled: !!familyId,
    })

    // 2. Fetch master task bank templates
    const { data: templates = [], isLoading: loadingTemplates, refetch: refetchTemplates } = useQuery<MasterTaskTemplate[]>({
        queryKey: ['master_task_bank', familyId],
        queryFn: async () => {
            if (!familyId) return []
            const { data, error } = await supabase
                .from('master_task_bank')
                .select('*')
                .eq('family_id', familyId)
                .order('created_at', { ascending: false })

            if (error) console.error('Error fetching templates:', error)
            return data || []
        },
        enabled: !!familyId,
    })

    // 3. Preload existing scheduled tasks from master_task_bank for the selected week
    const { data: existingTasks = [] } = useQuery({
        queryKey: ['tasks', 'allocated-week', familyId, weekStartStr],
        queryFn: async () => {
            if (!familyId) return []
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('family_id', familyId)
                .not('master_task_id', 'is', null)
                .gte('due_date', weekStartStr)
                .lte('due_date', weekEndStr)

            if (error) {
                console.error('Error fetching existing weekly tasks:', error)
                return []
            }
            return data || []
        },
        enabled: !!familyId,
    })

    // When existing tasks for the selected week are fetched, populate draft state
    useEffect(() => {
        if (!existingTasks || existingTasks.length === 0) {
            setDraftAllocations([])
            return
        }

        // Group tasks by `${master_task_id}-${assigned_to}`
        const groupedMap = new Map<string, DraftAllocation>()

        for (const task of existingTasks) {
            if (!task.master_task_id || !task.assigned_to) continue
            const key = `${task.master_task_id}-${task.assigned_to}`
            const dayIndex = getDay(parseISO(task.due_date))

            if (!groupedMap.has(key)) {
                groupedMap.set(key, {
                    id: key,
                    master_task_id: task.master_task_id,
                    child_id: task.assigned_to,
                    title: task.title,
                    icon_key: task.icon_key,
                    description: task.description,
                    stars_value: task.stars_value,
                    selected_days: [dayIndex],
                })
            } else {
                const existing = groupedMap.get(key)!
                if (!existing.selected_days.includes(dayIndex)) {
                    existing.selected_days.push(dayIndex)
                    existing.selected_days.sort((a, b) => a - b)
                }
            }
        }

        setDraftAllocations(Array.from(groupedMap.values()))
    }, [existingTasks])

    // Configure sensors: MouseSensor for instant desktop drag, TouchSensor with short delay & tolerance for mobile
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200, // 200ms hold on touch devices to differentiate scrolling from dragging
                tolerance: 6, // Allow 6px drift during hold
            },
        })
    )

    // Collision detection: pointerWithin for high accuracy with finger/mouse, fallback to rectIntersection
    const collisionDetectionStrategy: CollisionDetection = (args) => {
        const pointerCollisions = pointerWithin(args)
        if (pointerCollisions.length > 0) {
            return pointerCollisions
        }
        return rectIntersection(args)
    }

    const dateRangeLabel = useMemo(() => {
        const startStr = format(weekStart, 'd בMMMM', { locale: he })
        const endStr = format(weekEnd, 'd בMMMM yyyy', { locale: he })
        return `${startStr} – ${endStr}`
    }, [weekStart, weekEnd])

    // Overall draft stats
    const totalWeeklyStars = useMemo(() => {
        return draftAllocations.reduce(
            (sum, a) => sum + a.selected_days.length * a.stars_value,
            0
        )
    }, [draftAllocations])

    const totalTaskInstances = useMemo(() => {
        return draftAllocations.reduce((sum, a) => sum + a.selected_days.length, 0)
    }, [draftAllocations])

    // Week navigation handlers
    function handlePrevWeek() {
        setCurrentWeekStart(prev => subWeeks(prev, 1))
    }
    function handleNextWeek() {
        setCurrentWeekStart(prev => addWeeks(prev, 1))
    }
    function handleJumpToCurrentWeek() {
        setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))
    }

    // Drag handlers
    function handleDragStart(event: DragStartEvent) {
        const { active } = event
        const data = active.data.current
        if (!data) return

        if (data.type === 'bank-template') {
            setActiveDragItem({
                type: 'bank-template',
                data: data.template as MasterTaskTemplate,
            })
        } else if (data.type === 'allocated-task') {
            setActiveDragItem({
                type: 'allocated-task',
                data: data.allocation as DraftAllocation,
            })
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveDragItem(null)

        if (!over) return

        const activeData = active.data.current
        const overData = over.data.current

        if (!activeData || !overData) return

        // Case 1: Dragging a template from Bank to a Child Column
        if (activeData.type === 'bank-template' && overData.type === 'child-column') {
            const template = activeData.template as MasterTaskTemplate
            const targetChildId = overData.childId as string
            const targetChild = children.find(c => c.id === targetChildId)

            if (!targetChild) return

            // Open Day & Star assignment modal for this child
            setAssignmentModalState({
                isOpen: true,
                childId: targetChild.id,
                childName: targetChild.full_name,
                template: template,
                initialDays: [0, 1, 2, 3, 4], // Weekdays default
                initialStars: template.default_stars,
            })
        }

        // Case 2: Dragging an allocated task to another Child Column
        if (activeData.type === 'allocated-task' && overData.type === 'child-column') {
            const allocation = activeData.allocation as DraftAllocation
            const targetChildId = overData.childId as string

            if (allocation.child_id !== targetChildId) {
                // Relocate to new child
                setDraftAllocations(prev =>
                    prev.map(item =>
                        item.id === allocation.id ? { ...item, child_id: targetChildId } : item
                    )
                )
            }
        }

        // Case 3: Dragging an allocated task back to Bank Column (Remove from draft)
        if (activeData.type === 'allocated-task' && overData.type === 'bank-column') {
            const allocation = activeData.allocation as DraftAllocation
            setDraftAllocations(prev => prev.filter(item => item.id !== allocation.id))
        }
    }

    // Modal confirmation: save or update allocation
    function handleSaveAssignment(selectedDays: number[], starsValue: number) {
        const { childId, template, allocationId } = assignmentModalState

        if (allocationId) {
            // Update existing allocation
            setDraftAllocations(prev =>
                prev.map(item =>
                    item.id === allocationId
                        ? { ...item, selected_days: selectedDays, stars_value: starsValue }
                        : item
                )
            )
        } else {
            // Check if this template is already assigned to this child
            const existingIndex = draftAllocations.findIndex(
                a => a.master_task_id === template.id && a.child_id === childId
            )

            if (existingIndex >= 0) {
                // Update days on existing assignment
                setDraftAllocations(prev =>
                    prev.map((item, idx) =>
                        idx === existingIndex
                            ? { ...item, selected_days: selectedDays, stars_value: starsValue }
                            : item
                    )
                )
            } else {
                // Create new draft allocation
                const newAllocation: DraftAllocation = {
                    id: `${template.id}-${childId}-${Date.now()}`,
                    master_task_id: template.id,
                    child_id: childId,
                    title: template.title,
                    icon_key: template.icon_key,
                    description: template.description,
                    stars_value: starsValue,
                    selected_days: selectedDays,
                }
                setDraftAllocations(prev => [...prev, newAllocation])
            }
        }
    }

    // Delete single allocation
    function handleDeleteAllocation(allocationId: string) {
        setDraftAllocations(prev => prev.filter(item => item.id !== allocationId))
    }

    // Edit allocation trigger
    function handleEditAllocation(allocation: DraftAllocation) {
        const child = children.find(c => c.id === allocation.child_id)
        const template = templates.find(t => t.id === allocation.master_task_id) || {
            id: allocation.master_task_id,
            family_id: familyId || '',
            created_by: null,
            title: allocation.title,
            description: allocation.description,
            default_stars: allocation.stars_value,
            icon_key: allocation.icon_key,
            created_at: '',
            updated_at: '',
        }

        setAssignmentModalState({
            isOpen: true,
            childId: allocation.child_id,
            childName: child?.full_name || 'ילד',
            template: template,
            allocationId: allocation.id,
            initialDays: allocation.selected_days,
            initialStars: allocation.stars_value,
        })
    }

    // Quick assign trigger for click/tap
    function handleQuickAssign(template: MasterTaskTemplate) {
        setQuickAssignTemplate(template)
    }

    // Reset draft allocations
    function handleResetDraft() {
        if (draftAllocations.length === 0) return
        if (confirm('האם לאפס את כל המשימות בטיוטת השבוע הנוכחי?')) {
            setDraftAllocations([])
            toast.info('הטיוטה אופסה')
        }
    }

    // Apply weekly schedule batch engine with deduplication upsert
    async function handleApplyWeeklySchedule() {
        if (draftAllocations.length === 0) return
        if (!familyId || !userId) {
            toast.error('שגיאה: פרטי משתמש או משפחה חסרים')
            return
        }

        setIsApplying(true)

        try {
            // Build task records for each allocation & selected day
            const tasksToUpsert = []
            for (const allocation of draftAllocations) {
                for (const dayIndex of allocation.selected_days) {
                    const targetDate = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd')
                    tasksToUpsert.push({
                        family_id: familyId,
                        created_by: userId,
                        assigned_to: allocation.child_id,
                        title: allocation.title,
                        description: allocation.description,
                        icon_key: allocation.icon_key,
                        stars_value: allocation.stars_value,
                        due_date: targetDate,
                        status: 'pending' as const,
                        master_task_id: allocation.master_task_id,
                    })
                }
            }

            // Deduplication upsert into Supabase tasks table
            // Guaranteed idempotent by UNIQUE (master_task_id, assigned_to, due_date)
            const { error: upsertError } = await supabase
                .from('tasks')
                .upsert(tasksToUpsert, {
                    onConflict: 'master_task_id,assigned_to,due_date',
                })

            if (upsertError) throw upsertError

            // Trigger celebratory confetti
            confetti({
                particleCount: 90,
                spread: 70,
                origin: { y: 0.6 },
            })

            toast.success(
                `הלוח השבועי הוחל בהצלחה! נוצרו/עודכנו ${tasksToUpsert.length} ביצועים יומיים לילדים.`
            )

            // Invalidate React Query caches
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['tasks'] }),
                queryClient.invalidateQueries({ queryKey: ['familyOverview'] }),
                queryClient.invalidateQueries({ queryKey: ['profiles'] }),
            ])
        } catch (err: any) {
            console.error('Error applying weekly schedule:', err)
            toast.error('שגיאה בהחלת הלוח השבועי: ' + (err.message || 'שגיאה לא צפויה'))
        } finally {
            setIsApplying(false)
        }
    }

    return (
        <div className="space-y-6 pb-28" dir="rtl">
            {/* 1. Header Bar: Week Selector, Date Range, Summary Counters */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Title & Date Range */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                                <CalendarRange size={20} />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">לוח תכנון שבועי (קנבן)</h1>
                        </div>
                        <p className="text-xs text-gray-500">
                            גררו משימות מבנק המשימות לעמודות הילדים (במסכי מגע: החזיקו קלות וגררו או השתמשו בידית האחיזה / כפתור השיבוץ).
                        </p>
                    </div>

                    {/* Week Navigator Controls */}
                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200/80 self-stretch sm:self-auto justify-between sm:justify-start">
                        <button
                            onClick={handleNextWeek}
                            className="p-2 hover:bg-white text-gray-700 hover:text-indigo-600 rounded-xl transition-all shadow-2xs"
                            title="השבוע הבא"
                        >
                            <ChevronRight size={18} />
                        </button>

                        <div className="flex items-center gap-2 px-3 text-sm font-bold text-gray-800">
                            <Calendar size={16} className="text-indigo-600" />
                            <span>{dateRangeLabel}</span>
                            {!isThisWeek && (
                                <button
                                    onClick={handleJumpToCurrentWeek}
                                    className="text-[11px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full hover:bg-indigo-200 transition-colors mr-1"
                                >
                                    חזור להיום
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handlePrevWeek}
                            className="p-2 hover:bg-white text-gray-700 hover:text-indigo-600 rounded-xl transition-all shadow-2xs"
                            title="השבוע הקודם"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    </div>
                </div>

                {/* Summary counters ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                    <div className="bg-indigo-50/60 border border-indigo-100/60 p-3 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-gray-500 block">משימות בטיוטה</span>
                            <span className="text-lg font-bold text-indigo-700">{draftAllocations.length}</span>
                        </div>
                        <div className="text-indigo-600">
                            <Sparkles size={20} />
                        </div>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-100/60 p-3 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-gray-500 block">סה״כ כוכבים שבועיים</span>
                            <span className="text-lg font-bold text-amber-700">{totalWeeklyStars} ⭐</span>
                        </div>
                        <div className="text-amber-500">
                            <Star size={20} fill="currentColor" />
                        </div>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-100/60 p-3 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-gray-500 block">ביצועים מתוזמנים</span>
                            <span className="text-lg font-bold text-emerald-700">{totalTaskInstances}</span>
                        </div>
                        <div className="text-emerald-600">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>

                    <div className="bg-purple-50/60 border border-purple-100/60 p-3 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-gray-500 block">ילדים בלוח</span>
                            <span className="text-lg font-bold text-purple-700">{children.length}</span>
                        </div>
                        <div className="text-purple-600">
                            <Users size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. DndContext Interactive Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetectionStrategy}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                autoScroll={{
                    threshold: { x: 0.15, y: 0.15 },
                    acceleration: 5,
                }}
            >
                <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start touch-pan-x overscroll-x-contain">
                    {/* Source Column: Master Task Bank */}
                    <DroppableBankColumn
                        templates={templates}
                        onQuickAssign={handleQuickAssign}
                        onCreateNewTemplate={() => setIsCreateTemplateOpen(true)}
                    />

                    {/* Destination Columns: One per child */}
                    {loadingChildren ? (
                        <div className="flex gap-4">
                            {[1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className="w-[280px] h-[450px] bg-gray-100 rounded-2xl animate-pulse"
                                />
                            ))}
                        </div>
                    ) : children.length === 0 ? (
                        <div className="flex-1 bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                            <p className="font-bold text-sm mb-1">אין עדיין פרופילי ילדים במשפחה</p>
                            <p className="text-xs">הוסיפו ילדים בניהול המשפחה כדי להתחיל לשבץ משימות שבועיות.</p>
                        </div>
                    ) : (
                        children.map(child => (
                            <DroppableChildColumn
                                key={child.id}
                                child={child}
                                allocations={draftAllocations.filter(a => a.child_id === child.id)}
                                onEditAllocation={handleEditAllocation}
                                onDeleteAllocation={handleDeleteAllocation}
                            />
                        ))
                    )}
                </div>

                {/* 3. DragOverlay for smooth physics preview while dragging */}
                <DragOverlay dropAnimation={null} zIndex={100}>
                    {activeDragItem ? (
                        <div
                            className="bg-white rounded-xl border-2 border-indigo-500 p-3 shadow-2xl scale-105 rotate-2 opacity-95 pointer-events-none cursor-grabbing touch-none select-none"
                            dir="rtl"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-lg">
                                    <IconRenderer
                                        iconKey={activeDragItem.data.icon_key}
                                        size={20}
                                    />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-900">
                                        {activeDragItem.data.title}
                                    </h4>
                                    <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                                        <Star size={11} fill="currentColor" className="text-amber-500" />
                                        <span>
                                            {'default_stars' in activeDragItem.data
                                                ? `${activeDragItem.data.default_stars} כוכבים`
                                                : `${activeDragItem.data.stars_value} כוכבים`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* 4. Day & Star Assignment Modal (Opens on Drop or Click) */}
            <DayAssignmentModal
                isOpen={assignmentModalState.isOpen}
                onClose={() => setAssignmentModalState(prev => ({ ...prev, isOpen: false }))}
                childName={assignmentModalState.childName}
                templateTitle={assignmentModalState.template.title}
                templateIcon={assignmentModalState.template.icon_key}
                defaultStars={assignmentModalState.template.default_stars}
                initialDays={assignmentModalState.initialDays}
                initialStars={assignmentModalState.initialStars}
                onConfirm={handleSaveAssignment}
                onDelete={
                    assignmentModalState.allocationId
                        ? () => handleDeleteAllocation(assignmentModalState.allocationId!)
                        : undefined
                }
            />

            {/* 5. Create Template Modal (Directly accessible from Bank Column) */}
            <TaskTemplateModal
                isOpen={isCreateTemplateOpen}
                onClose={() => setIsCreateTemplateOpen(false)}
                onSuccess={() => refetchTemplates()}
            />

            {/* 6. Quick Assign Child Picker (When user clicks assign instead of dragging) */}
            {quickAssignTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-gray-100" dir="rtl">
                        <h3 className="font-bold text-sm text-gray-900 mb-1">
                            שבץ משימה: &quot;{quickAssignTemplate.title}&quot;
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">בחר לאיזה ילד לשבץ משימה זו:</p>
                        <div className="space-y-2 mb-4">
                            {children.map(child => (
                                <button
                                    key={child.id}
                                    type="button"
                                    onClick={() => {
                                        setQuickAssignTemplate(null)
                                        setAssignmentModalState({
                                            isOpen: true,
                                            childId: child.id,
                                            childName: child.full_name,
                                            template: quickAssignTemplate,
                                            initialDays: [0, 1, 2, 3, 4],
                                            initialStars: quickAssignTemplate.default_stars,
                                        })
                                    }}
                                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-right"
                                >
                                    <span className="font-bold text-xs text-gray-800">{child.full_name}</span>
                                    <span className="text-[11px] text-indigo-600 font-semibold">בחר &larr;</span>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setQuickAssignTemplate(null)}
                            className="w-full py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            ביטול
                        </button>
                    </div>
                </div>
            )}

            {/* 7. Sticky Bottom Action Bar */}
            <StickyActionBar
                draftCount={draftAllocations.length}
                childrenCount={new Set(draftAllocations.map(a => a.child_id)).size}
                totalWeeklyStars={totalWeeklyStars}
                totalInstances={totalTaskInstances}
                isApplying={isApplying}
                onApply={handleApplyWeeklySchedule}
                onReset={handleResetDraft}
            />

            {/* 8. Full-screen Loading Overlay during Apply */}
            {isApplying && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-200"
                    dir="rtl"
                >
                    <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20 flex flex-col items-center max-w-sm text-center shadow-2xl">
                        <Loader2 size={44} className="animate-spin text-indigo-400 mb-4" />
                        <h3 className="text-lg font-bold mb-1.5">מחיל את הלוח השבועי...</h3>
                        <p className="text-xs text-gray-300 leading-relaxed">
                            מחשב תאריכים מדויקים, מעדכן משימות קיימות ומייצר ביצועים חדשים בלוחות הילדים ללא כפילויות.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

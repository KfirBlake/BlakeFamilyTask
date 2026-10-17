'use client'

import { useDraggable } from '@dnd-kit/core'
import { Star, GripVertical, Edit2, Trash2 } from 'lucide-react'
import IconRenderer from '@/components/ui/IconRenderer'

const DAY_LABELS: Record<number, string> = {
    0: 'א׳',
    1: 'ב׳',
    2: 'ג׳',
    3: 'ד׳',
    4: 'ה׳',
    5: 'ו׳',
    6: 'ש׳',
}

export interface DraftAllocation {
    id: string
    master_task_id: string
    child_id: string
    title: string
    icon_key: string | null
    description: string | null
    stars_value: number
    selected_days: number[] // 0 for Sunday .. 6 for Saturday
}

type Props = {
    allocation: DraftAllocation
    onEdit: (allocation: DraftAllocation) => void
    onDelete: (allocationId: string) => void
}

export default function DraggableAllocatedCard({ allocation, onEdit, onDelete }: Props) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `allocated-${allocation.id}`,
        data: {
            type: 'allocated-task',
            allocation,
        },
    })

    const isEveryday = allocation.selected_days.length === 7
    const isWeekdays =
        allocation.selected_days.length === 5 &&
        [0, 1, 2, 3, 4].every(d => allocation.selected_days.includes(d))
    const isWeekend =
        allocation.selected_days.length === 2 &&
        [5, 6].every(d => allocation.selected_days.includes(d))

    const weeklyTotalStars = allocation.selected_days.length * allocation.stars_value

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`
                group relative bg-white rounded-xl border border-gray-200/90 p-3 shadow-xs
                hover:shadow-md hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing
                select-none touch-manipulation
                ${isDragging ? 'opacity-30 border-dashed border-indigo-400 scale-95' : ''}
            `}
            style={{
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
            }}
            dir="rtl"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    {/* Touch-optimized Drag handle */}
                    <div
                        className="p-1.5 -mr-1 text-gray-300 group-hover:text-indigo-500 active:text-indigo-600 rounded-lg hover:bg-gray-100/80 active:bg-indigo-50 transition-colors flex-shrink-0 touch-none cursor-grab active:cursor-grabbing"
                        title="גרור משימה לעמודה אחרת"
                    >
                        <GripVertical size={16} />
                    </div>
                    <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-base flex-shrink-0 overflow-hidden pointer-events-none">
                        <IconRenderer iconKey={allocation.icon_key} size={18} />
                    </div>
                    <div className="min-w-0 pointer-events-none">
                        <h4 className="text-xs font-bold text-gray-900 truncate" title={allocation.title}>
                            {allocation.title}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                            <Star size={11} fill="currentColor" className="text-amber-500" />
                            <span>{allocation.stars_value} ליום</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-indigo-600 font-bold">{weeklyTotalStars} שבועי</span>
                        </div>
                    </div>
                </div>

                {/* Edit & Delete Action buttons */}
                <div className="flex items-center gap-1 opacity-80 sm:opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(allocation)
                        }}
                        onTouchStart={(e) => {
                            e.stopPropagation()
                        }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 active:text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 rounded-lg transition-colors"
                        title="ערוך ימים וכוכבים"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete(allocation.id)
                        }}
                        onTouchStart={(e) => {
                            e.stopPropagation()
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 active:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                        title="הסר משימה"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Scheduled Days Chips */}
            <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1 pointer-events-none">
                {isEveryday ? (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold border border-indigo-100/60">
                        כל השבוע (7 ימים)
                    </span>
                ) : isWeekdays ? (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-100/60">
                        ימי חול (א׳-ה׳)
                    </span>
                ) : isWeekend ? (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[10px] font-bold border border-purple-100/60">
                        סופ״ש (ו׳-ש׳)
                    </span>
                ) : (
                    allocation.selected_days.map(dayIndex => (
                        <span
                            key={dayIndex}
                            className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[10px] font-bold"
                        >
                            {DAY_LABELS[dayIndex]}
                        </span>
                    ))
                )}
            </div>
        </div>
    )
}

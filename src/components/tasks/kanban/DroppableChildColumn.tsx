'use client'

import { useDroppable } from '@dnd-kit/core'
import Image from 'next/image'
import { Star, Sparkles, Inbox } from 'lucide-react'
import DraggableAllocatedCard, { DraftAllocation } from './DraggableAllocatedCard'

export interface ChildProfile {
    id: string
    full_name: string
    avatar_url: string | null
    role: string
}

type Props = {
    child: ChildProfile
    allocations: DraftAllocation[]
    onEditAllocation: (allocation: DraftAllocation) => void
    onDeleteAllocation: (allocationId: string) => void
}

export default function DroppableChildColumn({
    child,
    allocations,
    onEditAllocation,
    onDeleteAllocation,
}: Props) {
    const { setNodeRef, isOver } = useDroppable({
        id: `child-${child.id}`,
        data: {
            type: 'child-column',
            childId: child.id,
        },
    })

    const totalWeeklyStars = allocations.reduce(
        (sum, a) => sum + a.selected_days.length * a.stars_value,
        0
    )

    return (
        <div
            className={`
                flex flex-col bg-gray-50/80 rounded-2xl border transition-all duration-200
                min-w-[280px] max-w-[320px] flex-1
                ${isOver
                    ? 'border-indigo-400 bg-indigo-50/40 ring-4 ring-indigo-500/10 shadow-lg'
                    : 'border-gray-200 shadow-xs hover:border-gray-300'
                }
            `}
            dir="rtl"
        >
            {/* Column Header */}
            <div className="p-4 border-b border-gray-200/80 bg-white rounded-t-2xl">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold overflow-hidden flex-shrink-0">
                            {child.avatar_url ? (
                                <Image
                                    src={child.avatar_url}
                                    alt={child.full_name}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span>{child.full_name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm truncate" title={child.full_name}>
                                {child.full_name}
                            </h3>
                            <span className="text-[11px] text-gray-400 font-medium">
                                {allocations.length} משימות מתוזמנות
                            </span>
                        </div>
                    </div>

                    {/* Total Stars Pill */}
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                        <Star size={14} fill="currentColor" className="text-amber-500" />
                        <span>{totalWeeklyStars}</span>
                    </div>
                </div>
            </div>

            {/* Droppable Card List Area */}
            <div
                ref={setNodeRef}
                className="flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[380px] max-h-[620px]"
            >
                {allocations.length === 0 ? (
                    <div
                        className={`
                            h-full min-h-[340px] flex flex-col items-center justify-center p-6 text-center
                            border-2 border-dashed rounded-xl transition-all
                            ${isOver
                                ? 'border-indigo-400 bg-indigo-50/70 text-indigo-700 scale-98'
                                : 'border-gray-200 text-gray-400 bg-white/50'
                            }
                        `}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isOver ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                            {isOver ? <Sparkles size={24} /> : <Inbox size={24} />}
                        </div>
                        <p className="text-xs font-bold mb-1">
                            {isOver ? 'שחרר כאן לשיבוץ!' : 'אין משימות מתוזמנות'}
                        </p>
                        <p className="text-[11px] max-w-[180px] leading-relaxed">
                            {isOver ? 'המשימה תשובץ לילד זה' : 'גרור משימה מבנק המשימות כדי לשבץ לילד'}
                        </p>
                    </div>
                ) : (
                    <>
                        {allocations.map(allocation => (
                            <DraggableAllocatedCard
                                key={allocation.id}
                                allocation={allocation}
                                onEdit={onEditAllocation}
                                onDelete={onDeleteAllocation}
                            />
                        ))}
                        {isOver && (
                            <div className="p-3 border-2 border-dashed border-indigo-400 rounded-xl bg-indigo-50/50 text-indigo-600 text-xs text-center font-bold animate-pulse">
                                + שחרר משימה כאן
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

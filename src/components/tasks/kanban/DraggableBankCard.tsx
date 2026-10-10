'use client'

import { useDraggable } from '@dnd-kit/core'
import { Star, GripVertical, UserPlus } from 'lucide-react'
import IconRenderer from '@/components/ui/IconRenderer'
import { MasterTaskTemplate } from '../bank/TaskTemplateModal'

type Props = {
    template: MasterTaskTemplate
    onQuickAssign?: (template: MasterTaskTemplate) => void
}

export default function DraggableBankCard({ template, onQuickAssign }: Props) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `bank-${template.id}`,
        data: {
            type: 'bank-template',
            template,
        },
    })

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`
                group relative bg-white rounded-xl border border-gray-200 p-3 shadow-xs
                hover:shadow-md hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing select-none
                ${isDragging ? 'opacity-40 border-dashed border-indigo-400 scale-95' : ''}
            `}
            dir="rtl"
        >
            <div className="flex items-center gap-2.5">
                {/* Drag handle icon */}
                <div className="text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0">
                    <GripVertical size={16} />
                </div>

                {/* Task Icon */}
                <div className="w-9 h-9 bg-indigo-50 border border-indigo-100/80 rounded-lg flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                    <IconRenderer iconKey={template.icon_key} size={20} />
                </div>

                {/* Title & Stars */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate" title={template.title}>
                        {template.title}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-0.5">
                        <Star size={12} fill="currentColor" className="text-amber-500" />
                        <span>{template.default_stars} כוכבים</span>
                    </div>
                </div>

                {/* Quick Assign button for mobile/touch or fast click */}
                {onQuickAssign && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onQuickAssign(template)
                        }}
                        className="opacity-0 group-hover:opacity-100 sm:opacity-0 focus:opacity-100 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="שבץ לילד בלחיצה"
                    >
                        <UserPlus size={15} />
                    </button>
                )}
            </div>
        </div>
    )
}

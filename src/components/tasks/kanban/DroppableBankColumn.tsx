'use client'

import { useState, useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Search, FolderKanban, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import DraggableBankCard from './DraggableBankCard'
import { MasterTaskTemplate } from '../bank/TaskTemplateModal'

type Props = {
    templates: MasterTaskTemplate[]
    onQuickAssign?: (template: MasterTaskTemplate) => void
    onCreateNewTemplate?: () => void
}

export default function DroppableBankColumn({
    templates,
    onQuickAssign,
    onCreateNewTemplate,
}: Props) {
    const [searchTerm, setSearchTerm] = useState('')

    const { setNodeRef, isOver } = useDroppable({
        id: 'bank-column',
        data: {
            type: 'bank-column',
        },
    })

    const filteredTemplates = useMemo(() => {
        if (!searchTerm.trim()) return templates
        const term = searchTerm.toLowerCase()
        return templates.filter(t =>
            t.title.toLowerCase().includes(term) ||
            (t.description && t.description.toLowerCase().includes(term))
        )
    }, [templates, searchTerm])

    return (
        <div
            ref={setNodeRef}
            className={`
                flex flex-col bg-gray-50/80 rounded-2xl border transition-all duration-200
                min-w-[280px] max-w-[320px] flex-shrink-0
                ${isOver
                    ? 'border-red-400 bg-red-50/30 ring-4 ring-red-500/10 shadow-lg'
                    : 'border-gray-200 shadow-xs hover:border-gray-300'
                }
            `}
            dir="rtl"
        >
            {/* Column Header */}
            <div className="p-4 border-b border-gray-200/80 bg-white rounded-t-2xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                            <FolderKanban size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">בנק משימות</h3>
                            <span className="text-[11px] text-gray-400 font-medium">
                                {templates.length} משימות זמינות
                            </span>
                        </div>
                    </div>

                    {onCreateNewTemplate && (
                        <button
                            type="button"
                            onClick={onCreateNewTemplate}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="הוסף משימה חדשה לבנק"
                        >
                            <Plus size={18} />
                        </button>
                    )}
                </div>

                {/* In-column Search */}
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="חיפוש משימה..."
                        className="w-full pr-8 pl-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <Search size={14} />
                    </div>
                </div>
            </div>

            {/* Droppable Area for returning cards back / List of available bank cards */}
            <div
                className="flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[380px] max-h-[620px]"
            >
                {/* Visual drop indicator when dragging an allocated card back to the bank */}
                {isOver && (
                    <div className="p-4 border-2 border-dashed border-red-400 rounded-xl bg-red-50 text-red-600 text-xs text-center font-bold flex flex-col items-center gap-1.5 animate-pulse">
                        <Trash2 size={20} />
                        <span>שחרר כאן להסרת המשימה מהלוח</span>
                    </div>
                )}

                {templates.length === 0 ? (
                    <div className="h-full min-h-[250px] flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white/50 text-gray-400">
                        <p className="text-xs font-bold mb-1">בנק המשימות ריק</p>
                        <p className="text-[11px] mb-3">צרו משימות קבועות בבנק כדי לשבץ אותן כאן.</p>
                        <Link
                            href="/dashboard/tasks/bank"
                            className="text-xs text-indigo-600 font-bold hover:underline"
                        >
                            מעבר לניהול הבנק &larr;
                        </Link>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                        לא נמצאו משימות התואמות לחיפוש
                    </div>
                ) : (
                    filteredTemplates.map(template => (
                        <DraggableBankCard
                            key={template.id}
                            template={template}
                            onQuickAssign={onQuickAssign}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

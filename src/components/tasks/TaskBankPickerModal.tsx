'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useUserPreferences } from '@/contexts/UserContext'
import { useQuery } from '@tanstack/react-query'
import { X, Search, Star } from 'lucide-react'
import IconRenderer from '@/components/ui/IconRenderer'
import { MasterTaskTemplate } from '@/components/tasks/bank/TaskTemplateModal'

type Props = {
    isOpen: boolean
    onClose: () => void
    onSelectTemplate: (template: MasterTaskTemplate) => void
}

export default function TaskBankPickerModal({ isOpen, onClose, onSelectTemplate }: Props) {
    const [searchTerm, setSearchTerm] = useState('')
    const supabase = createClient()
    const { familyId } = useUserPreferences()

    const { data: templates = [], isLoading } = useQuery<MasterTaskTemplate[]>({
        queryKey: ['master_task_bank', familyId],
        queryFn: async () => {
            if (!familyId) return []
            const { data, error } = await supabase
                .from('master_task_bank')
                .select('*')
                .eq('family_id', familyId)
                .order('created_at', { ascending: false })
            if (error) throw error
            return data || []
        },
        enabled: !!familyId && isOpen,
    })

    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return templates
        const term = searchTerm.toLowerCase()
        return templates.filter(t =>
            t.title.toLowerCase().includes(term) ||
            (t.description && t.description.toLowerCase().includes(term))
        )
    }, [templates, searchTerm])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
                className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                dir="rtl"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900">בחר משימה מהבנק</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                        aria-label="סגור"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="חיפוש משימה..."
                            className="w-full pr-9 pl-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                {/* Template List */}
                <div className="overflow-y-auto max-h-[60vh] p-3 space-y-2">
                    {isLoading ? (
                        <div className="py-10 flex justify-center">
                            <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-10 text-center text-gray-500 text-sm">
                            {searchTerm ? 'לא נמצאו משימות תואמות' : 'בנק המשימות ריק. הוסף תבניות בדף בנק המשימות.'}
                        </div>
                    ) : (
                        filtered.map(template => (
                            <button
                                key={template.id}
                                type="button"
                                onClick={() => {
                                    onSelectTemplate(template)
                                    onClose()
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-right group"
                            >
                                {/* Icon */}
                                <div className="w-11 h-11 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-xl flex-shrink-0 transition-colors">
                                    <IconRenderer iconKey={template.icon_key || '📝'} size={24} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">{template.title}</p>
                                    {template.description && (
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{template.description}</p>
                                    )}
                                </div>

                                {/* Stars badge */}
                                <div className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg flex-shrink-0">
                                    <Star size={12} className="fill-yellow-500 text-yellow-500" />
                                    {template.default_stars}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}


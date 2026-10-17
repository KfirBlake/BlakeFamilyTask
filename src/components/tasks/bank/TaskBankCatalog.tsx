'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useUserPreferences } from '@/contexts/UserContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Plus,
    Search,
    Star,
    Edit2,
    Trash2,
    Sparkles,
    CalendarRange,
    FolderKanban
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import IconRenderer from '@/components/ui/IconRenderer'
import TaskTemplateModal, { MasterTaskTemplate } from './TaskTemplateModal'

export default function TaskBankCatalog() {
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<MasterTaskTemplate | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const supabase = createClient()
    const { familyId } = useUserPreferences()
    const queryClient = useQueryClient()

    const { data: templates = [], isLoading } = useQuery<MasterTaskTemplate[]>({
        queryKey: ['master_task_bank', familyId],
        queryFn: async () => {
            if (!familyId) return []
            const { data, error } = await supabase
                .from('master_task_bank')
                .select('*')
                .eq('family_id', familyId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching master task bank:', error)
                throw error
            }
            return data || []
        },
        enabled: !!familyId,
    })

    const filteredTemplates = useMemo(() => {
        if (!searchTerm.trim()) return templates
        const term = searchTerm.toLowerCase()
        return templates.filter(t =>
            t.title.toLowerCase().includes(term) ||
            (t.description && t.description.toLowerCase().includes(term))
        )
    }, [templates, searchTerm])

    async function handleDelete(template: MasterTaskTemplate) {
        if (!confirm(`האם אתה בטוח שברצונך למחוק את המשימה "${template.title}" מבנק המשימות?`)) {
            return
        }

        setDeletingId(template.id)
        try {
            const { error } = await supabase
                .from('master_task_bank')
                .delete()
                .eq('id', template.id)

            if (error) throw error

            toast.success(`המשימה "${template.title}" נמחקה מהבנק`)
            queryClient.invalidateQueries({ queryKey: ['master_task_bank', familyId] })
        } catch (err: any) {
            console.error('Error deleting template:', err)
            toast.error('שגיאה במחיקת המשימה מהבנק')
        } finally {
            setDeletingId(null)
        }
    }

    function handleEdit(template: MasterTaskTemplate) {
        setEditingTemplate(template)
        setIsModalOpen(true)
    }

    function handleCreateNew() {
        setEditingTemplate(null)
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header & Planning Link Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-l from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
                            <FolderKanban size={22} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">בנק משימות משפחתי</h1>
                    </div>
                    <p className="text-sm text-gray-600">
                        מאגר המשימות הקבועות של המשפחה. מכאן תוכלו לשבץ משימות לילדים בלוח השבועי בקלות ובגרירה.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/dashboard/tasks/planning"
                        className="flex items-center gap-2 bg-white text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-sm"
                    >
                        <CalendarRange size={18} />
                        מעבר ללוח תכנון שבועי
                    </Link>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
                    >
                        <Plus size={18} />
                        משימה חדשה לבנק
                    </button>
                </div>
            </div>

            {/* Top Toolbar: Search & Counters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="חיפוש משימה בבנק לפי שם או תיאור..."
                        className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <Search size={18} />
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 self-end sm:self-center font-medium">
                    <span>סה״כ במאגר:</span>
                    <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                        {templates.length}
                    </span>
                    {searchTerm && (
                        <span className="text-xs text-gray-400">
                            (נמצאו {filteredTemplates.length})
                        </span>
                    )}
                </div>
            </div>

            {/* Content: Loading Skeleton / Empty State / Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">בנק המשימות ריק עדיין</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                        צרו את המשימות החוזרות של הבית (סידור מיטה, פינוי מדיח, הכנת שיעורים...) כדי שתוכלו לשבץ אותן בקלות לילדים מדי שבוע.
                    </p>
                    <button
                        onClick={handleCreateNew}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        הוסף משימה ראשונה לבנק
                    </button>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-8">
                    <p className="text-gray-500 text-sm">לא נמצאו משימות התואמות את החיפוש &quot;{searchTerm}&quot;</p>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="mt-3 text-indigo-600 text-sm font-semibold hover:underline"
                    >
                        נקה חיפוש
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredTemplates.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => handleEdit(template)}
                            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group"
                        >
                            <div>
                                {/* Card Header: Icon & Stars badge */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shadow-xs border border-indigo-100 flex-shrink-0 overflow-hidden">
                                        <IconRenderer iconKey={template.icon_key} size={28} className="w-full h-full object-cover flex items-center justify-center" />
                                    </div>
                                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-full text-xs font-bold">
                                        <Star size={14} fill="currentColor" className="text-amber-500" />
                                        <span>{template.default_stars}</span>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="font-bold text-gray-900 text-base mb-1.5 line-clamp-2" title={template.title}>
                                    {template.title}
                                </h3>

                                {/* Description */}
                                {template.description ? (
                                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">
                                        {template.description}
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-400 italic mb-4">אין תיאור נוסף</p>
                                )}
                            </div>

                            {/* Card Footer: Action Buttons */}
                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
                                <span className="text-[11px] text-gray-400">
                                    ברירת מחדל: {template.default_stars} כוכבים
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="ערוך משימה"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template)}
                                        disabled={deletingId === template.id}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="מחק משימה"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            <TaskTemplateModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingTemplate(null)
                }}
                template={editingTemplate}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['master_task_bank', familyId] })
                }}
            />
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Star, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import IconPicker from '@/components/ui/IconPicker'
import { useUserPreferences } from '@/contexts/UserContext'

export interface MasterTaskTemplate {
    id: string
    family_id: string
    created_by: string | null
    title: string
    description: string | null
    default_stars: number
    icon_key: string | null
    created_at: string
    updated_at: string
}

type Props = {
    isOpen: boolean
    onClose: () => void
    template?: MasterTaskTemplate | null
    onSuccess: () => void
}

export default function TaskTemplateModal({ isOpen, onClose, template, onSuccess }: Props) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [defaultStars, setDefaultStars] = useState(5)
    const [selectedIcon, setSelectedIcon] = useState('📝')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()
    const { userId, familyId } = useUserPreferences()

    useEffect(() => {
        if (isOpen) {
            if (template) {
                setTitle(template.title || '')
                setDescription(template.description || '')
                setDefaultStars(template.default_stars ?? 5)
                setSelectedIcon(template.icon_key || '📝')
            } else {
                setTitle('')
                setDescription('')
                setDefaultStars(5)
                setSelectedIcon('📝')
            }
            setError(null)
        }
    }, [isOpen, template])

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (!title.trim()) {
            setError('נא להזין כותרת למשימה')
            return
        }

        if (title.length > 50) {
            setError('כותרת המשימה יכולה להכיל עד 50 תווים')
            return
        }

        if (defaultStars < 1) {
            setError('מספר הכוכבים חייב להיות לפחות 1')
            return
        }

        if (!familyId) {
            setError('שגיאה: מזהה משפחה חסר')
            return
        }

        setSubmitting(true)

        try {
            if (template) {
                // Update existing template
                const { error: updateError } = await supabase
                    .from('master_task_bank')
                    .update({
                        title: title.trim(),
                        description: description.trim() || null,
                        default_stars: defaultStars,
                        icon_key: selectedIcon,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', template.id)

                if (updateError) throw updateError
                toast.success('תבנית המשימה עודכנה בהצלחה')
            } else {
                // Create new template
                const { error: insertError } = await supabase
                    .from('master_task_bank')
                    .insert([{
                        family_id: familyId,
                        created_by: userId,
                        title: title.trim(),
                        description: description.trim() || null,
                        default_stars: defaultStars,
                        icon_key: selectedIcon
                    }])

                if (insertError) throw insertError
                toast.success('משימה חדשה נוספה לבנק בהצלחה')
            }

            onSuccess()
            onClose()
        } catch (err: any) {
            console.error('Error saving template:', err)
            setError(err.message || 'שגיאה בשמירת התבנית')
            toast.error('שגיאה בשמירת המשימה')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
            <div
                className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100"
                dir="rtl"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/70">
                    <h3 className="font-bold text-lg text-gray-900">
                        {template ? 'עריכת משימה בבנק' : 'הוספת משימה חדשה לבנק'}
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Icon Selection */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                            אייקון או תמונה
                        </label>
                        <IconPicker
                            selectedIcon={selectedIcon}
                            onSelectIcon={(icon) => setSelectedIcon(icon)}
                        />
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                                כותרת המשימה <span className="text-red-500">*</span>
                            </label>
                            <span className={`text-xs ${title.length > 50 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                {title.length}/50
                            </span>
                        </div>
                        <input
                            type="text"
                            required
                            maxLength={50}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="לדוגמה: סידור החדר, שטיפת כלים, שיעורי בית..."
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Default Stars */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                            ערך כוכבים ברירת מחדל <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min={1}
                                max={100}
                                required
                                value={defaultStars}
                                onChange={(e) => setDefaultStars(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none">
                                <Star size={18} fill="currentColor" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400">ניתן לשנות את ערך הכוכבים גם בעת הקצאת המשימה לילד מסוים</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                            הוראות / תיאור (אופציונלי)
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="פירוט נוסף לגבי המשימה, למשל: להרים צעצועים, לקפל בגדים..."
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !title.trim()}
                            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting && <Loader2 size={16} className="animate-spin" />}
                            {template ? 'עדכן משימה' : 'שמור משימה לבנק'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

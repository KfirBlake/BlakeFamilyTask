'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X } from 'lucide-react'
import IconPicker from '../ui/IconPicker'
import { useUserPreferences } from '@/contexts/UserContext'

type Props = {
    isOpen: boolean
    onClose: () => void
    childId: string
    onSuccess: () => void
    initialDate?: string
}

export default function CreateChildTaskModal({ isOpen, onClose, childId, onSuccess, initialDate }: Props) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState(initialDate || '')
    const [selectedIcon, setSelectedIcon] = useState('📝')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setTitle('')
            setDescription('')
            setDueDate(initialDate || '')
            setSelectedIcon('📝')
            setError(null)
        }
    }, [isOpen, initialDate])

    const supabase = createClient()
    const { userId, familyId } = useUserPreferences()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (!userId || !familyId) {
            setError('לא מחובר')
            setLoading(false)
            return
        }

        const taskData = {
            family_id: familyId,
            created_by: userId,
            assigned_to: childId,
            title,
            description,
            stars_value: 0,
            due_date: dueDate || null,
            icon_key: selectedIcon,
            status: 'pending'
        }

        const { error: insertError } = await supabase
            .from('tasks')
            .insert([taskData])

        setLoading(false)

        if (insertError) {
            setError('שגיאה בשמירה: ' + insertError.message)
        } else {
            setTitle('')
            setDescription('')
            setDueDate('')
            onSuccess()
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900">הוספת משימה עבורי</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}

                    <div>
                        <IconPicker selectedIcon={selectedIcon || '📝'} onSelectIcon={setSelectedIcon} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">שם המשימה</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="לדוגמה: לקרוא ספר"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">תיאור (אופציונלי)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                            placeholder="פרטים נוספים..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">תאריך יעד</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                            style={{ direction: 'rtl' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-70"
                    >
                        {loading ? 'שומר...' : 'שמירת משימה'}
                    </button>
                </form>
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Star, Calendar } from 'lucide-react'

type Task = {
    id: string
    title: string
    description: string | null
    stars_value: number
    status: 'pending' | 'waiting_approval' | 'approved'
    due_date: string | null
    icon_key: string
}

type Props = {
    isOpen: boolean
    onClose: () => void
    childId: string
    onSuccess: () => void
    initialDate?: string
    task?: Task | null
}

const EMOJI_ICONS = ['🧹', '🛏️', '🍽️', '🐶', '📚', '🦷', '🧺', '🪴']

export default function CreateTaskModal({ isOpen, onClose, childId, onSuccess, initialDate, task }: Props) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [stars, setStars] = useState(10)
    const [dueDate, setDueDate] = useState(initialDate || '')
    const [selectedIcon, setSelectedIcon] = useState(EMOJI_ICONS[0])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Populate form if editing existing task, or reset/set date if new
    useEffect(() => {
        if (isOpen) {
            if (task) {
                // Editing mode
                setTitle(task.title)
                setDescription(task.description || '')
                setStars(task.stars_value)
                setDueDate(task.due_date || '')
                setSelectedIcon(task.icon_key)
            } else {
                // Create mode - reset or use initialDate
                setTitle('')
                setDescription('')
                setStars(10)
                setDueDate(initialDate || '')
                setSelectedIcon(EMOJI_ICONS[0])
            }
        }
    }, [isOpen, task, initialDate])

    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setError('לא מחובר')
            setLoading(false)
            return
        }

        // Determine family_id (could pass as prop, or fetch. Fetching is safer RLS-wise but slower? 
        // Actually RLS policy checks "family_id in (select family_id...)" so we must pass correct family_id.
        // Let's fetch context first.
        const { data: profile } = await supabase.from('profiles').select('family_id, role').eq('id', user.id).single()

        if (!profile) {
            console.error('Profile not found')
            setError('שגיאת פרופיל')
            setLoading(false)
            return
        }

        console.log('User Profile Role:', profile.role)

        console.log('Creating task with:', {
            family_id: profile.family_id,
            created_by: user.id,
            assigned_to: childId,
            stars,
            status: 'pending'
        })

        const taskData = {
            family_id: profile.family_id,
            created_by: user.id, // In edit mode, maybe we strictly shouldn't change created_by, but usually fine or ignored by DB if not needed.
            assigned_to: childId,
            title,
            description,
            stars_value: stars,
            due_date: dueDate || null,
            icon_key: selectedIcon,
            status: task ? task.status : 'pending' // Keep status if editing, else pending
        }

        let resultError

        if (task) {
            // Update
            const { error: updateError } = await supabase
                .from('tasks')
                .update(taskData)
                .eq('id', task.id)
            resultError = updateError
        } else {
            // Insert
            const { error: insertError } = await supabase
                .from('tasks')
                .insert([taskData])
            resultError = insertError
        }

        setLoading(false)

        if (resultError) {
            setError('שגיאה בשמירה: ' + resultError.message)
        } else {
            // Reset form
            setTitle('')
            setDescription('')
            setStars(10)
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
                    <h3 className="font-bold text-gray-900">{task ? 'עריכת משימה' : 'משימה חדשה'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}

                    {/* Icons */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">בחר אייקון</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                            {EMOJI_ICONS.map(icon => (
                                <button
                                    type="button"
                                    key={icon}
                                    onClick={() => setSelectedIcon(icon)}
                                    className={`w-10 h-10 flex items-center justify-center text-xl rounded-full transition-all ${selectedIcon === icon ? 'bg-indigo-600 scale-110 shadow-md' : 'bg-gray-100 hover:bg-gray-200'}`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">שם המשימה</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="לדוגמה: לסדר את החדר"
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

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">כוכבים</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    max={100}
                                    value={stars}
                                    onChange={e => setStars(Number(e.target.value))}
                                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <Star size={16} className="absolute left-3 top-3 text-yellow-500 fill-yellow-500" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך יעד</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                                    style={{ direction: 'rtl' }}
                                />
                                {/* Note: Icon might overlap text in RTL depending on browser. */}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-70"
                    >
                        {loading ? 'שומר...' : (task ? 'עדכן משימה' : 'צור משימה')}
                    </button>
                </form>
            </div>
        </div>
    )
}

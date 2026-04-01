'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Star, Calendar, RefreshCw } from 'lucide-react'
import { format, addDays, addWeeks, addMonths, addYears, getDay, isBefore, isSameDay } from 'date-fns'
import IconPicker from '../ui/IconPicker'
import { useUserPreferences } from '@/contexts/UserContext'

type Task = {
    id: string
    title: string
    description: string | null
    stars_value: number
    status: 'pending' | 'waiting_approval' | 'approved'
    due_date: string | null
    icon_key: string
    template_id?: string | null
}

type Props = {
    isOpen: boolean
    onClose: () => void
    childId: string
    onSuccess: () => void
    initialDate?: string
    task?: Task | null
}

export default function CreateTaskModal({ isOpen, onClose, childId, onSuccess, initialDate, task }: Props) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [stars, setStars] = useState(10)
    const [dueDate, setDueDate] = useState(initialDate || '')
    const [selectedIcon, setSelectedIcon] = useState('📝')

    // Recurring state
    const [isRecurring, setIsRecurring] = useState(false)
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly')
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
    const [endOption, setEndOption] = useState<'count' | 'date'>('count')
    const [endCount, setEndCount] = useState<number>(10)
    const [endDate, setEndDate] = useState<string>('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            if (task) {
                // Editing mode
                setTitle(task.title)
                setDescription(task.description || '')
                setStars(task.stars_value)
                setDueDate(task.due_date || '')
                setSelectedIcon(task.icon_key)
                // We don't populate recurrence form because editing only tweaks this instance
                setIsRecurring(false)
            } else {
                // Create mode - reset
                setTitle('')
                setDescription('')
                setStars(10)
                setDueDate(initialDate || '')
                setSelectedIcon('📝')
                setIsRecurring(false)
                setFrequency('weekly')
                setDaysOfWeek([])
                setEndOption('count')
                setEndCount(10)
                setEndDate('')
            }
        }
    }, [isOpen, task, initialDate])

    const supabase = createClient()
    const { userId, familyId } = useUserPreferences()

    async function handleDeleteFutureTasks() {
        if (!task || !task.template_id) return
        if (!confirm('האם למחוק את כל המשימות העתידיות בסדרה זו?')) return

        setLoading(true)
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('template_id', task.template_id)
            .gt('due_date', task.due_date || new Date().toISOString().split('T')[0])
            .eq('status', 'pending')

        setLoading(false)
        if (error) {
            setError('שגיאה במחיקת משימות עתידיות: ' + error.message)
        } else {
            alert('הפעולה בוצעה. משימות עתידיות שנמחקו יורדו מהלוח.')
            onSuccess()
            onClose()
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (!userId || !familyId) {
            setError('לא מחובר')
            setLoading(false)
            return
        }

        if (task) {
            // Update single existing task
            const { error: updateError } = await supabase
                .from('tasks')
                .update({
                    title,
                    description,
                    stars_value: stars,
                    due_date: dueDate || null,
                    icon_key: selectedIcon
                })
                .eq('id', task.id)

            setLoading(false)
            if (updateError) setError('שגיאה בעדכון: ' + updateError.message)
            else {
                onSuccess()
                onClose()
            }
            return
        }

        // --- Create Mode ---

        let templateId: string | null = null

        if (isRecurring) {
            // Include template logic
            const templateData = {
                family_id: familyId,
                created_by: userId,
                assigned_to: childId,
                title,
                description,
                stars_value: stars,
                icon_key: selectedIcon,
                frequency,
                days_of_week: frequency === 'weekly' ? daysOfWeek : null,
                end_after_count: endOption === 'count' ? endCount : null,
                end_date: endOption === 'date' && endDate ? endDate : null
            }

            const { data: insertedTemplate, error: templateError } = await supabase
                .from('task_templates')
                .insert([templateData])
                .select()
                .single()

            if (templateError) {
                setError('שגיאה ביצירת תבנית מחזורית: ' + templateError.message)
                setLoading(false)
                return
            }

            templateId = insertedTemplate.id

            // Generate occurrences
            let currentDate = new Date(dueDate || new Date())
            const occurrences = []
            let count = 0
            const MAX_SAFE_COUNT = 365
            const targetDateStr = endOption === 'date' && endDate ? endDate : null

            while (count < (endOption === 'count' ? endCount : MAX_SAFE_COUNT)) {
                if (targetDateStr && isBefore(new Date(targetDateStr), currentDate) && !isSameDay(new Date(targetDateStr), currentDate)) {
                    break;
                }

                if (frequency === 'weekly' && daysOfWeek.length > 0) {
                    if (daysOfWeek.includes(getDay(currentDate))) {
                        occurrences.push(format(currentDate, 'yyyy-MM-dd'))
                        count++
                    }
                    currentDate = addDays(currentDate, 1)
                    continue;
                }

                occurrences.push(format(currentDate, 'yyyy-MM-dd'))
                count++

                if (frequency === 'daily') currentDate = addDays(currentDate, 1)
                else if (frequency === 'weekly') currentDate = addWeeks(currentDate, 1)
                else if (frequency === 'monthly') currentDate = addMonths(currentDate, 1)
                else if (frequency === 'yearly') currentDate = addYears(currentDate, 1)
            }

            const tasksToInsert = occurrences.map(dateStr => ({
                family_id: familyId,
                created_by: userId,
                assigned_to: childId,
                title,
                description,
                stars_value: stars,
                due_date: dateStr,
                icon_key: selectedIcon,
                status: 'pending',
                template_id: templateId
            }))

            const { error: insertError } = await supabase.from('tasks').insert(tasksToInsert)

            setLoading(false)
            if (insertError) setError('שגיאה בשמירת משימות: ' + insertError.message)
            else {
                onSuccess()
                onClose()
            }

        } else {
            // Single insert
            const taskData = {
                family_id: familyId,
                created_by: userId,
                assigned_to: childId,
                title,
                description,
                stars_value: stars,
                due_date: dueDate || null,
                icon_key: selectedIcon,
                status: 'pending'
            }

            const { error: insertError } = await supabase.from('tasks').insert([taskData])

            setLoading(false)
            if (insertError) setError('שגיאה בשמירה: ' + insertError.message)
            else {
                onSuccess()
                onClose()
            }
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

                <div className="max-h-[85vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}

                        {/* Icons */}
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
                                placeholder="לדוגמה: לסדר את החדר"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור (אופציונלי)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-16"
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
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    style={{ direction: 'rtl' }}
                                />
                            </div>
                        </div>

                        {/* Recurring Toggle (Only visible in Creation mode) */}
                        {!task && (
                            <div className="flex items-center gap-2 mt-2 bg-gray-50 p-4 rounded-xl border border-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    id="recurringToggle"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="w-5 h-5 text-indigo-600 rounded cursor-pointer border-gray-300"
                                />
                                <label htmlFor="recurringToggle" className="font-bold text-gray-800 cursor-pointer select-none">חזור על משימה זו</label>
                            </div>
                        )}

                        {/* Recurring Settings Block */}
                        {isRecurring && !task && (
                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-sm font-medium text-indigo-900 mb-1">תדירות</label>
                                    <select
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value as any)}
                                        className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                                    >
                                        <option value="daily">כל יום</option>
                                        <option value="weekly">כל שבוע</option>
                                        <option value="monthly">כל חודש</option>
                                        <option value="yearly">כל שנה</option>
                                    </select>
                                </div>

                                {frequency === 'weekly' && (
                                    <div>
                                        <label className="block text-sm font-medium text-indigo-900 mb-2">בימים:</label>
                                        <div className="flex gap-1 justify-between" dir="ltr">
                                            {[
                                                { id: 0, str: 'א' },
                                                { id: 1, str: 'ב' },
                                                { id: 2, str: 'ג' },
                                                { id: 3, str: 'ד' },
                                                { id: 4, str: 'ה' },
                                                { id: 5, str: 'ו' },
                                                { id: 6, str: 'ש' }
                                            ].map(day => (
                                                <button
                                                    type="button"
                                                    key={day.id}
                                                    onClick={() => {
                                                        if (daysOfWeek.includes(day.id)) setDaysOfWeek(daysOfWeek.filter(d => d !== day.id))
                                                        else setDaysOfWeek([...daysOfWeek, day.id])
                                                    }}
                                                    className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center transition-colors shadow-sm ${daysOfWeek.includes(day.id) ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-100'
                                                        }`}
                                                >
                                                    {day.str}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-indigo-100/50">
                                    <label className="block text-sm font-medium text-indigo-900 mb-3">סיום תדירות:</label>
                                    <div className="flex items-center gap-6 mb-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" checked={endOption === 'count'} onChange={() => setEndOption('count')} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                                            <span className="text-sm font-medium text-gray-700">כמות פעמים</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" checked={endOption === 'date'} onChange={() => setEndOption('date')} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                                            <span className="text-sm font-medium text-gray-700">תאריך יעד</span>
                                        </label>
                                    </div>

                                    {endOption === 'count' ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={2}
                                                max={365}
                                                value={endCount}
                                                onChange={e => setEndCount(Number(e.target.value))}
                                                className="w-24 px-3 py-2 border border-indigo-200 bg-white rounded-lg text-center outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                            />
                                            <span className="text-sm font-medium text-indigo-900/80">מופעים</span>
                                        </div>
                                    ) : (
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            required={endOption === 'date'}
                                            className="w-full px-4 py-2 border border-indigo-200 bg-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                            style={{ direction: 'rtl' }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Edit Mode Warning for Recurring Tasks */}
                        {task && task.template_id && (
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mt-2">
                                <div className="flex items-center gap-2 font-bold justify-start mb-2" style={{ color: '#c2410c' }}>
                                    <RefreshCw size={16} />
                                    <span>משימה זו היא חלק מסדרה מחזורית.</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDeleteFutureTasks}
                                    className="bg-white hover:bg-red-50 text-red-600 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors w-full border border-red-200 shadow-sm"
                                >
                                    בטל חזרתיות (מחק משימות עתידיות)
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors disabled:opacity-70 text-lg shadow-sm"
                        >
                            {loading ? 'שומר...' : (task ? 'עדכן משימה' : 'צור משימה')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

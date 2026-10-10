'use client'

import { useState, useEffect } from 'react'
import { X, Star, Calendar, Check, Trash2 } from 'lucide-react'
import IconRenderer from '@/components/ui/IconRenderer'

const DAYS = [
    { index: 0, short: 'א׳', name: 'ראשון' },
    { index: 1, short: 'ב׳', name: 'שני' },
    { index: 2, short: 'ג׳', name: 'שלישי' },
    { index: 3, short: 'ד׳', name: 'רביעי' },
    { index: 4, short: 'ה׳', name: 'חמישי' },
    { index: 5, short: 'ו׳', name: 'שישי' },
    { index: 6, short: 'ש׳', name: 'שבת' },
]

type Props = {
    isOpen: boolean
    onClose: () => void
    childName: string
    templateTitle: string
    templateIcon?: string | null
    defaultStars: number
    initialDays?: number[]
    initialStars?: number
    onConfirm: (selectedDays: number[], starsValue: number) => void
    onDelete?: () => void
}

export default function DayAssignmentModal({
    isOpen,
    onClose,
    childName,
    templateTitle,
    templateIcon,
    defaultStars,
    initialDays = [0, 1, 2, 3, 4], // Default weekdays
    initialStars,
    onConfirm,
    onDelete,
}: Props) {
    const [selectedDays, setSelectedDays] = useState<number[]>(initialDays)
    const [stars, setStars] = useState<number>(initialStars ?? defaultStars)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setSelectedDays(initialDays.length > 0 ? initialDays : [0, 1, 2, 3, 4])
            setStars(initialStars ?? defaultStars)
            setError(null)
        }
    }, [isOpen, initialDays, initialStars, defaultStars])

    if (!isOpen) return null

    function toggleDay(dayIndex: number) {
        setSelectedDays(prev =>
            prev.includes(dayIndex)
                ? prev.filter(d => d !== dayIndex)
                : [...prev, dayIndex].sort((a, b) => a - b)
        )
    }

    function setPreset(days: number[]) {
        setSelectedDays(days)
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (selectedDays.length === 0) {
            setError('יש לבחור לפחות יום אחד לביצוע המשימה')
            return
        }
        if (stars < 1) {
            setError('ערך הכוכבים חייב להיות לפחות 1')
            return
        }

        onConfirm(selectedDays, stars)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
            <div
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100"
                dir="rtl"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/70">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                            <IconRenderer iconKey={templateIcon} size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-gray-900 line-clamp-1">{templateTitle}</h3>
                            <p className="text-xs text-indigo-600 font-medium">שיבוץ עבור: {childName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                            {error}
                        </div>
                    )}

                    {/* Quick Presets */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                            בחירה מהירה
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setPreset([0, 1, 2, 3, 4, 5, 6])}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                                    selectedDays.length === 7
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                כל יום (שבוע מלא)
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreset([0, 1, 2, 3, 4])}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                                    selectedDays.length === 5 && [0, 1, 2, 3, 4].every(d => selectedDays.includes(d))
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                ימי חול (א׳-ה׳)
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreset([5, 6])}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                                    selectedDays.length === 2 && [5, 6].every(d => selectedDays.includes(d))
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                סופ״ש (ו׳-ש׳)
                            </button>
                        </div>
                    </div>

                    {/* Day Selection Checkboxes */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                            ימים מבוקשים <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-7 gap-1.5">
                            {DAYS.map(day => {
                                const isSelected = selectedDays.includes(day.index)
                                return (
                                    <button
                                        key={day.index}
                                        type="button"
                                        onClick={() => toggleDay(day.index)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                                            isSelected
                                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 font-medium'
                                        }`}
                                    >
                                        <span className="text-sm">{day.short}</span>
                                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
                                            {day.name}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Stars Override */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                                כוכבים לכל ביצוע
                            </label>
                            <span className="text-xs text-gray-400">
                                (ברירת מחדל בבנק: {defaultStars})
                            </span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                min={1}
                                max={100}
                                required
                                value={stars}
                                onChange={(e) => setStars(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none">
                                <Star size={18} fill="currentColor" />
                            </div>
                        </div>
                        <p className="text-[11px] text-gray-500">
                            סה״כ כוכבים שבועיים עבור משימה זו: <span className="font-bold text-indigo-600">{selectedDays.length * stars} ⭐</span> ({selectedDays.length} ימים × {stars})
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    onDelete()
                                    onClose()
                                }}
                                className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                title="הסר משימה מלוח הילד"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-sm shadow-sm"
                        >
                            <Check size={16} />
                            שמור שיבוץ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

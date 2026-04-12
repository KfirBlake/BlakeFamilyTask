'use client'

import { X } from 'lucide-react'
import SwipeToComplete from './SwipeToComplete'
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import IconRenderer from '../ui/IconRenderer'
import { useUserPreferences } from '@/contexts/UserContext'

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
    task: Task | null
    onSuccess: () => void
}

export default function ChildTaskDetailModal({ isOpen, onClose, task, onSuccess }: Props) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const { preferences } = useUserPreferences()

    if (!isOpen || !task) return null

    async function handleComplete() {
        if (task?.status !== 'pending') return
        setLoading(true)

        if (preferences.settings_confetti) {
            import('canvas-confetti').then((mod) => {
                const confetti = mod.default;
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.5 },
                    colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
                })
            })
        }

        const { error } = await supabase
            .from('tasks')
            .update({
                status: 'waiting_approval',
                completed_at: new Date().toISOString()
            })
            .eq('id', task?.id)

        setLoading(false)

        if (!error) {
            onSuccess()
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
            <div className="bg-white rounded-t-[2rem] sm:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in duration-300">
                <div className="p-8 relative">
                    <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center mt-6">
                        <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-6xl shadow-inner border border-indigo-100 mb-8 transform -rotate-3 overflow-hidden p-2">
                            <IconRenderer iconKey={task.icon_key} className="w-full h-full text-6xl flex items-center justify-center object-cover" />
                        </div>

                        <h2 className="text-3xl font-black text-gray-900 text-center mb-8 leading-tight max-w-[85%]">
                            {task.title}
                        </h2>

                        {task.status === 'pending' ? (
                            <div className="w-full mt-2">
                                <SwipeToComplete onComplete={handleComplete} loading={loading} />
                            </div>
                        ) : (
                            <div className="w-full bg-gray-100 text-gray-500 font-bold py-4 rounded-full text-center mt-2 border-2 border-transparent">
                                {task.status === 'approved' ? 'אושר! כל הכבוד! 🎉' : 'ממתין לאישור הורים ⏳'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

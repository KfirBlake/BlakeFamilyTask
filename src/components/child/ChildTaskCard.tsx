'use client'

import { motion } from 'framer-motion'
import { Check, Star, Clock } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import SwipeToComplete from './SwipeToComplete'
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
    task: Task
    onUpdate: () => void
}

export default function ChildTaskCard({ task, onUpdate }: Props) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const { preferences } = useUserPreferences()

    async function handleComplete() {
        if (task.status !== 'pending') return
        setLoading(true)

        // Optimistic confetti explosion
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
            .eq('id', task.id)

        if (!error) {
            onUpdate()
        }
        setLoading(false)
    }

    const isPending = task.status === 'pending'
    const isWaiting = task.status === 'waiting_approval'
    const isApproved = task.status === 'approved'

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
                relative overflow-hidden rounded-[2rem] p-6 shadow-sm border-[3px] transition-all h-full flex flex-col justify-between
                ${isPending ? 'bg-white border-indigo-100 hover:border-indigo-200 hover:shadow-md' : ''}
                ${isWaiting ? 'bg-gray-50 border-gray-100 opacity-70' : ''}
                ${isApproved ? 'bg-green-50 border-green-200' : ''}
            `}
        >
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-50 w-20 h-20 rounded-2xl flex items-center justify-center text-5xl shadow-sm border-2 border-indigo-100 overflow-hidden p-2">
                        <IconRenderer iconKey={task.icon_key} className="w-full h-full text-5xl flex items-center justify-center object-cover" />
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-base font-black border-2 border-white shadow-sm transform -rotate-2">
                        +{task.stars_value} <Star size={16} className="fill-yellow-100 text-yellow-900" />
                    </div>
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{task.title}</h3>
                {task.description && <p className="text-gray-500 text-base mb-6 line-clamp-2 leading-relaxed">{task.description}</p>}
            </div>

            {isPending && (
                <SwipeToComplete onComplete={handleComplete} loading={loading} />
            )}

            {isWaiting && (
                <div className="w-full bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl text-center flex items-center justify-center gap-2 border-2 border-gray-200 mt-4 select-none">
                    <Clock size={20} />
                    ממתין לאישור
                </div>
            )}

            {isApproved && (
                <div className="w-full bg-green-100 text-green-700 font-black py-4 rounded-2xl text-center flex items-center justify-center gap-2 border-2 border-green-200 mt-4 select-none shadow-sm">
                    <div className="bg-white p-1 rounded-full"><Check size={16} strokeWidth={4} className="text-green-600" /></div>
                    <span>אושר! כל הכבוד!</span>
                </div>
            )}
        </motion.div>
    )
}

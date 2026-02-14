'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Check, X, Clock, Star } from 'lucide-react'
import { format } from 'date-fns'

type Task = {
    id: string
    title: string
    status: string
    stars_value: number
    assigned_to: string
    completed_at: string
    profiles: {
        full_name: string
        avatar_url: string | null
    }
}

export default function ApprovalsPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchPendingApprovals()
    }, [])

    async function fetchPendingApprovals() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase.from('profiles').select('family_id').eq('id', user.id).single()

        if (profile) {
            const { data } = await supabase
                .from('tasks')
                .select('*, profiles:assigned_to(full_name, avatar_url)')
                .eq('family_id', profile.family_id)
                .eq('status', 'waiting_approval')
                .order('completed_at', { ascending: false })

            if (data) {
                setTasks(data as unknown as Task[])
            }
        }
        setLoading(false)
    }

    async function handleApprove(taskId: string) {
        // 1. Update task to 'approved'
        // 2. Trigger should handle star increment
        const { error } = await supabase
            .from('tasks')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: (await supabase.auth.getUser()).data.user?.id
            })
            .eq('id', taskId)

        if (!error) {
            fetchPendingApprovals()
        } else {
            alert('Error approving task: ' + error.message)
        }
    }

    async function handleReject(taskId: string) {
        // Return to 'pending'
        const { error } = await supabase
            .from('tasks')
            .update({ status: 'pending' })
            .eq('id', taskId)

        if (!error) {
            fetchPendingApprovals()
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">אישור משימות</h1>

            {loading ? (
                <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ) : tasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Check size={32} />
                    </div>
                    <p className="text-gray-500">אין משימות שממתינות לאישור.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tasks.map(task => (
                        <div key={task.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                                        {task.profiles.avatar_url ? <img src={task.profiles.avatar_url} className="w-full h-full" /> : task.profiles.full_name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{task.title}</h3>
                                        <p className="text-sm text-gray-500">{task.profiles.full_name}</p>
                                    </div>
                                </div>
                                <div className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                    {task.stars_value} <Star size={12} fill="currentColor" />
                                </div>
                            </div>

                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={12} />
                                הושלם ב: {task.completed_at ? format(new Date(task.completed_at), 'dd/MM/yyyy HH:mm') : '-'}
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button
                                    onClick={() => handleApprove(task.id)}
                                    className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Check size={16} />
                                    אשר
                                </button>
                                <button
                                    onClick={() => handleReject(task.id)}
                                    className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <X size={16} />
                                    החזר לביצוע
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

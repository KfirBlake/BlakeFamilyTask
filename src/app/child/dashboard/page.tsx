'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import ChildTaskCard from '@/components/child/ChildTaskCard'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { he } from 'date-fns/locale'
import { User } from 'lucide-react'
import { useTouchdownCelebration } from '@/hooks/useTouchdownCelebration'
import TouchdownCelebration from '@/components/child/TouchdownCelebration'
import { useUserPreferences } from '@/contexts/UserContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'

type Task = {
    id: string
    title: string
    description: string | null
    stars_value: number
    status: 'pending' | 'waiting_approval' | 'approved'
    due_date: string | null
    icon_key: string
}

export default function ChildDashboardPage() {
    const supabase = createClient()
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'waiting_approval'>('pending')
    const { userId } = useUserPreferences()
    const queryClient = useQueryClient()

    const { data: profile } = useQuery({
        queryKey: ['profiles', userId],
        queryFn: async () => {
            if (!userId) return null
            const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
            return data || null
        },
        enabled: !!userId,
    })

    const { data: tasks = [], isPending: loading } = useQuery<Task[]>({
        queryKey: ['tasks', userId, 'week'],
        queryFn: async () => {
            if (!userId) return []
            const now = new Date()
            const weekStart = format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd')
            const weekEnd = format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd')

            const { data } = await supabase
                .from('tasks')
                .select('*')
                .eq('assigned_to', userId)
                .gte('due_date', weekStart)
                .lte('due_date', weekEnd)
            return (data as Task[]) || []
        },
        enabled: !!userId,
    })

    const { showTouchdown, setShowTouchdown } = useTouchdownCelebration(tasks, new Date(), profile?.id)

    const handleUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    }

    const filteredTasks = tasks.filter(task => {
        if (filterStatus === 'all') return true
        if (filterStatus === 'pending') return task.status === 'pending'
        if (filterStatus === 'waiting_approval') return task.status === 'waiting_approval' || task.status === 'approved' // Show done stuff
        return true
    }).sort((a, b) => {
        // Sort Priority: Pending -> Waiting -> Approved
        const statusPriority = { 'pending': 0, 'waiting_approval': 1, 'approved': 2 }
        const statusDiff = statusPriority[a.status] - statusPriority[b.status]

        if (statusDiff !== 0) return statusDiff

        // Then by Due Date
        if (a.due_date && b.due_date) {
            return a.due_date.localeCompare(b.due_date)
        }
        return 0
    })

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-md mx-auto">
            {showTouchdown && <TouchdownCelebration onClose={() => setShowTouchdown(false)} />}

            {/* Header - Only visible on desktop if needed, or customized message */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setFilterStatus('pending')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                        ${filterStatus === 'pending' ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
                >
                    לעשות 📝
                </button>
                <button
                    onClick={() => setFilterStatus('waiting_approval')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                        ${filterStatus === 'waiting_approval' ? 'bg-green-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
                >
                    סיימתי ✅
                </button>
                <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                        ${filterStatus === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
                >
                    הכל 📋
                </button>
            </div>

            {/* Tasks Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map(task => (
                            <ChildTaskCard
                                key={task.id}
                                task={task}
                                onUpdate={handleUpdate}
                            />
                    ))
                ) : (
                    <div className="col-span-1 md:col-span-2 text-center py-20 opacity-50 bg-white rounded-3xl border border-gray-100 shadow-sm mx-auto w-full max-w-sm">
                        <div className="text-6xl mb-4">
                            {filterStatus === 'pending' ? '🎉' : filterStatus === 'all' ? '✨' : '📝'}
                        </div>
                        <h3 className="text-xl font-bold">
                            {filterStatus === 'pending' ? 'אין משימות פתוחות!' : 'אין משימות כאן'}
                        </h3>
                        <p>
                            {filterStatus === 'pending' ? 'סיימת את כל המשימות להיום' : 'נסה לשנות את הסינון'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

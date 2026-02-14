'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

type Task = {
    id: string
    title: string
    description: string
    status: 'pending' | 'waiting_approval' | 'approved'
    due_date: string
    stars_value: number
    icon_key: string
}

export default function TaskCalendar({ childId }: { childId: string }) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchTasks()
    }, [childId])

    async function fetchTasks() {
        setLoading(true)
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('assigned_to', childId)
            .order('due_date', { ascending: true }) // Close dates first
            .order('created_at', { ascending: false })

        if (data) {
            setTasks(data)
        }
        setLoading(false)
    }

    // Grouping or just sorting? 
    // Let's separate into "Active" (Pending) and "Waiting Approval" and "Completed" (Approved)
    const activeTasks = tasks.filter(t => t.status === 'pending')
    const waitingTasks = tasks.filter(t => t.status === 'waiting_approval')
    const completedTasks = tasks.filter(t => t.status === 'approved')

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-500" /></div>
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: To Do */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <CalendarIcon size={18} />
                    לביצוע ({activeTasks.length})
                </h3>
                <div className="space-y-3">
                    {activeTasks.length === 0 && (
                        <p className="text-sm text-gray-400 italic">אין משימות לביצוע. איזה כיף!</p>
                    )}
                    {activeTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </div>
            </div>

            {/* Column 2: Waiting Approval */}
            <div className="space-y-4">
                <h3 className="font-bold text-orange-600 flex items-center gap-2">
                    <Clock size={18} />
                    ממתין לאישור ({waitingTasks.length})
                </h3>
                <div className="space-y-3">
                    {waitingTasks.length === 0 && (
                        <p className="text-sm text-gray-400 italic">אין משימות שממתינות לאישור.</p>
                    )}
                    {waitingTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </div>
            </div>

            {/* Column 3: Completed */}
            <div className="space-y-4">
                <h3 className="font-bold text-green-600 flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    הושלם ({completedTasks.length})
                </h3>
                <div className="space-y-3">
                    {completedTasks.length === 0 && (
                        <p className="text-sm text-gray-400 italic">עדיין לא הושלמו משימות.</p>
                    )}
                    {completedTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function TaskCard({ task }: { task: Task }) {
    const statusColors = {
        pending: 'border-l-4 border-l-gray-300 bg-white',
        waiting_approval: 'border-l-4 border-l-orange-400 bg-orange-50',
        approved: 'border-l-4 border-l-green-500 bg-green-50 opacity-75',
    }

    return (
        <div className={`p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${statusColors[task.status]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-gray-900">{task.title}</h4>
                    {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>}
                </div>
                <div className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap">
                    {task.stars_value} ★
                </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <CalendarIcon size={14} />
                {task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : 'ללא תאריך'}
            </div>
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { Trophy, Star, Clock, CheckCircle } from 'lucide-react'

// types
type ChildStats = {
    id: string
    name: string
    avatar: string | null
    starsBalance: number
    tasksTotal: number
    tasksCompleted: number // waiting_approval + approved
    tasksApproved: number
    tasksPendingApproval: number // waiting_approval
}

export default function FamilyOverview() {
    const [childrenStats, setChildrenStats] = useState<ChildStats[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase.from('profiles').select('family_id').eq('id', user.id).single()
        if (!profile?.family_id) return

        // Fetch children
        const { data: children } = await supabase
            .from('profiles')
            .select('*')
            .eq('family_id', profile.family_id)
            .eq('role', 'child')

        if (!children) {
            setLoading(false)
            return
        }

        const now = new Date()
        const start = startOfWeek(now, { weekStartsOn: 0 }) // Sunday start
        const end = endOfWeek(now, { weekStartsOn: 0 })

        // Fetch tasks
        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('family_id', profile.family_id)
            .gte('due_date', format(start, 'yyyy-MM-dd'))
            .lte('due_date', format(end, 'yyyy-MM-dd'))

        const stats: ChildStats[] = children.map(child => {
            const childTasks = tasks?.filter(t => t.assigned_to === child.id) || []

            const total = childTasks.length
            const approved = childTasks.filter(t => t.status === 'approved').length
            const pendingApproval = childTasks.filter(t => t.status === 'waiting_approval').length
            const completed = approved + pendingApproval

            return {
                id: child.id,
                name: child.display_name || child.full_name || 'ילד',
                avatar: child.avatar_url,
                starsBalance: child.stars_balance || 0,
                tasksTotal: total,
                tasksCompleted: completed,
                tasksApproved: approved,
                tasksPendingApproval: pendingApproval
            }
        })

        // Sort by pending approvals descending to bring attention, then by total completed
        stats.sort((a, b) => {
            if (b.tasksPendingApproval !== a.tasksPendingApproval) return b.tasksPendingApproval - a.tasksPendingApproval
            return b.tasksCompleted - a.tasksCompleted
        })

        setChildrenStats(stats)
        setLoading(false)
    }

    if (loading) {
        return <div className="animate-pulse bg-white p-6 rounded-2xl border border-gray-100 h-64"></div>
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <Trophy className="text-[#B3995D]" /> התקדמות המשפחה
                </h2>
                <span className="text-sm font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                    שבוע נוכחי
                </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block w-full overflow-x-auto">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-white text-gray-500 text-sm border-b border-gray-100">
                            <th className="py-4 px-6 font-bold">ילד/ה</th>
                            <th className="py-4 px-6 font-bold text-center">התקדמות שבועית</th>
                            <th className="py-4 px-6 font-bold text-center">הושלמו / סה"כ</th>
                            <th className="py-4 px-6 font-bold text-center">ממתינים לאישור</th>
                            <th className="py-4 px-6 font-bold text-center">סה"כ כוכבים</th>
                        </tr>
                    </thead>
                    <tbody>
                        {childrenStats.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500 font-medium">לא נמצאו ילדים בחשבון זה</td>
                            </tr>
                        )}
                        {childrenStats.map(child => {
                            const progressPercent = child.tasksTotal === 0 ? 0 : Math.round((child.tasksCompleted / child.tasksTotal) * 100)

                            return (
                                <tr key={child.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="py-5 px-6">
                                        <div className="flex items-center gap-4">
                                            {child.avatar ? (
                                                <img src={child.avatar} alt={child.name} className="w-12 h-12 rounded-full border-2 border-gray-100 object-cover shadow-sm" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl font-black text-indigo-700 shadow-sm border border-indigo-200/50">
                                                    {child.name.charAt(0)}
                                                </div>
                                            )}
                                            <span className="font-bold text-gray-900 text-lg tracking-tight">{child.name}</span>
                                        </div>
                                    </td>

                                    <td className="py-5 px-6 align-middle">
                                        <div className="flex items-center gap-3 justify-center w-full max-w-[220px] mx-auto">
                                            <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden flex-1 border border-gray-200/50 relative shadow-inner">
                                                {/* SF 49ers Styling: Metallic Gold background (#B3995D), Scarlet Red Fill (#AA0000) */}
                                                <div className="absolute inset-0 bg-[#B3995D] opacity-15"></div>
                                                <div
                                                    className="h-full bg-[#AA0000] rounded-full relative z-10 transition-all duration-1000 ease-out"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 min-w-[3rem] text-center tabular-nums">
                                                {progressPercent}%
                                            </span>
                                        </div>
                                    </td>

                                    <td className="py-5 px-6 text-center">
                                        <div className={`inline-flex items-center justify-center gap-1.5 font-bold px-3 py-1.5 rounded-xl border tabular-nums ${progressPercent === 100 && child.tasksTotal > 0
                                            ? 'bg-green-50 text-green-700 border-green-200 shadow-sm'
                                            : 'bg-gray-50 text-gray-700 border-gray-200/80'
                                            }`}>
                                            <CheckCircle size={16} className={progressPercent === 100 && child.tasksTotal > 0 ? "text-green-600" : "text-gray-400"} />
                                            {child.tasksCompleted} <span className="text-gray-400 font-normal mx-0.5">/</span> {child.tasksTotal}
                                        </div>
                                    </td>

                                    <td className="py-5 px-6 text-center">
                                        {child.tasksPendingApproval > 0 ? (
                                            <div className="inline-flex items-center justify-center gap-2 font-black text-white bg-[#AA0000] px-4 py-2 rounded-xl shadow-md border border-red-900 border-opacity-20 hover:scale-105 transition-transform cursor-default">
                                                <Clock size={16} className="animate-pulse" />
                                                <span className="tabular-nums">{child.tasksPendingApproval} ממתינים</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm font-medium">--</span>
                                        )}
                                    </td>

                                    <td className="py-5 px-6 text-center">
                                        <div className="inline-flex items-center justify-center gap-1.5 font-black text-yellow-800 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-200 shadow-sm">
                                            <span className="text-lg tabular-nums">{child.starsBalance}</span>
                                            <Star size={18} className="fill-yellow-500 text-yellow-500" />
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="md:hidden flex flex-col divide-y divide-gray-100">
                {childrenStats.length === 0 && (
                    <div className="py-8 text-center text-gray-500 font-medium">לא נמצאו ילדים בחשבון זה</div>
                )}
                {childrenStats.map(child => {
                    const progressPercent = child.tasksTotal === 0 ? 0 : Math.round((child.tasksCompleted / child.tasksTotal) * 100)

                    return (
                        <div key={child.id} className="p-5 flex flex-col gap-5 hover:bg-gray-50/30 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {child.avatar ? (
                                        <img src={child.avatar} alt={child.name} className="w-12 h-12 rounded-full border-2 border-gray-100 object-cover shadow-sm" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl font-black text-indigo-700 shadow-sm border border-indigo-200/50">
                                            {child.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="font-black text-gray-900 text-xl tracking-tight">{child.name}</span>
                                </div>
                                <div className="inline-flex items-center gap-1 font-black text-yellow-800 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-200 shadow-sm text-lg tabular-nums">
                                    {child.starsBalance}
                                    <Star size={16} className="fill-yellow-500 text-yellow-500" />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-bold text-gray-500">התקדמות שבועית ({progressPercent}%)</span>
                                    <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg border border-gray-200 tabular-nums">
                                        {child.tasksCompleted} <span className="text-gray-400 font-normal">/</span> {child.tasksTotal}
                                    </span>
                                </div>
                                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex-1 border border-gray-200/50 relative shadow-inner">
                                    <div className="absolute inset-0 bg-[#B3995D] opacity-15"></div>
                                    <div
                                        className="h-full bg-[#AA0000] rounded-full relative z-10 transition-all duration-1000 ease-out"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            {child.tasksPendingApproval > 0 && (
                                <div className="w-full flex items-center justify-center gap-2 font-black text-white bg-[#AA0000] p-3 rounded-xl shadow-md border border-red-900 border-opacity-20 animate-in zoom-in duration-300">
                                    <Clock size={16} className="animate-pulse" />
                                    <span>{child.tasksPendingApproval} משימות ממתינות לאישור!</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addWeeks,
    subWeeks,
    isSameDay,
    isToday,
    startOfDay
} from 'date-fns'
import { he } from 'date-fns/locale'
import { ChevronRight, ChevronLeft, Plus, CheckCircle, Clock, Star, Trophy, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CreateTaskModal from './CreateTaskModal'
import CreateChildTaskModal from './CreateChildTaskModal'
import ChildTaskDetailModal from '../child/ChildTaskDetailModal'
import IconRenderer from '../ui/IconRenderer'

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
    childId: string
    childName?: string | null
    childAvatar?: string | null
    isReadOnly?: boolean
}

const EMOJI_ICONS = ['🧹', '🛏️', '🍽️', '🐶', '📚', '🦷', '🧺', '🪴']

export default function WeeklyChildTaskCalendar({ childId, childName, childAvatar, isReadOnly = false }: Props) {
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }))
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState<Date>(new Date())
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isChildCreateModalOpen, setIsChildCreateModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [viewingTask, setViewingTask] = useState<Task | null>(null)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [weeklyStats, setWeeklyStats] = useState({ total: 0, completed: 0, percentage: 0 })


    const supabase = createClient()

    useEffect(() => {
        fetchTasks()
    }, [childId, currentWeekStart])

    async function fetchTasks() {
        setLoading(true)
        const start = startOfWeek(currentWeekStart, { weekStartsOn: 0 })
        const end = endOfWeek(currentWeekStart, { weekStartsOn: 0 })

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('assigned_to', childId)
            .gte('due_date', format(start, 'yyyy-MM-dd'))
            .lte('due_date', format(end, 'yyyy-MM-dd'))
            .order('due_date', { ascending: true })

        if (error) {
            console.error('Error fetching tasks:', error)
        } else {
            setTasks(data || [])
            calculateStats(data || [])
        }
        setLoading(false)
    }

    function calculateStats(weekTasks: Task[]) {
        const total = weekTasks.length
        // Count as completed if approved OR waiting for approval (child marked as done)
        const completed = weekTasks.filter(t => t.status === 'approved' || t.status === 'waiting_approval').length
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)
        setWeeklyStats({ total, completed, percentage })
    }

    function navigateWeek(direction: 'prev' | 'next') {
        if (direction === 'prev') setCurrentWeekStart(prev => subWeeks(prev, 1))
        else setCurrentWeekStart(prev => addWeeks(prev, 1))
    }

    function handleTaskAdded() {
        fetchTasks()
    }

    const weekDays = eachDayOfInterval({
        start: startOfWeek(currentWeekStart, { weekStartsOn: 0 }),
        end: endOfWeek(currentWeekStart, { weekStartsOn: 0 })
    })

    const getTasksForDay = (date: Date) => {
        return tasks.filter(task => task.due_date && isSameDay(new Date(task.due_date), date))
    }

    const getMotivationMessage = (percentage: number) => {
        if (percentage === 100) return "מדהים! כל המשימות הושלמו! 🏆"
        if (percentage >= 70) return "כמעט שם! רק עוד קצת לגביע השבועי."
        if (percentage >= 30) return "עבודה טובה! בדרך ליעד השבועי."
        return "בואו נתחיל! עוד כמה משימות והמד יתמלא."
    }

    // Circular Progress Component
    const CircularProgress = ({ percentage }: { percentage: number }) => {
        const radius = 30
        const circumference = 2 * Math.PI * radius
        const strokeDashoffset = circumference - (percentage / 100) * circumference

        return (
            <div className="relative flex items-center justify-center">
                <svg className="transform -rotate-90 w-20 h-20">
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-gray-200"
                    />
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={circumference}
                        className="text-indigo-600 drop-shadow-md"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-bold text-indigo-700">{percentage}%</span>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
            {/* Main Calendar Area */}
            <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black text-gray-900">
                                {format(currentWeekStart, 'MMMM yyyy', { locale: he })}
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={() => navigateWeek('prev')} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight /></button>
                                <button onClick={() => navigateWeek('next')} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft /></button>
                                <button onClick={() => setCurrentWeekStart(new Date())} className="p-1 hover:bg-gray-100 rounded-full">השבוע</button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-2xl border border-gray-200 shadow-sm">
                        <span className="text-sm font-bold text-gray-800 tabular-nums min-w-[140px] text-center">
                            {format(weekDays[0], 'd MMM', { locale: he })} - {format(weekDays[6], 'd MMM', { locale: he })}
                        </span>
                    </div>
                </div>

                {/* Days Grid */}
                <div className="flex-1 p-4 lg:p-6 overflow-x-auto scrollbar-hide">
                    <div className="grid grid-cols-7 gap-3 min-w-[800px] h-full">
                        {weekDays.map((day, index) => {
                            const dayTasks = getTasksForDay(day)
                            const isCurrentDay = isToday(day)
                            const isSelected = isSameDay(day, selectedDay)

                            return (
                                <motion.div
                                    key={day.toISOString()}
                                    layout
                                    onClick={() => setSelectedDay(day)}
                                    onDoubleClick={() => {
                                        setSelectedDay(day)
                                        if (isReadOnly) setIsChildCreateModalOpen(true)
                                        else setIsCreateModalOpen(true)
                                    }}
                                    className={`
                                        relative group flex flex-col rounded-2xl p-3 border transition-all cursor-pointer h-full min-h-[200px]
                                        ${isSelected
                                            ? 'bg-indigo-50/50 border-indigo-200 shadow-md ring-1 ring-indigo-200'
                                            : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-lg hover:-translate-y-1'
                                        }
                                        ${isCurrentDay ? 'ring-2 ring-purple-400 ring-offset-2' : ''}
                                    `}
                                >
                                    {/* Day Header */}
                                    <div className="text-center mb-3 pb-2 border-b border-gray-100/50">
                                        <div className="text-xs text-gray-500 font-medium">{format(day, 'EEEE', { locale: he })}</div>
                                        <div className={`text-lg font-bold ${isCurrentDay ? 'text-purple-600' : 'text-gray-700'}`}>
                                            {format(day, 'd')}
                                        </div>
                                        {isCurrentDay && <div className="text-[10px] text-purple-600 font-bold mt-0.5">היום!</div>}
                                    </div>

                                    {/* Tasks Stacks */}
                                    <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                                        {dayTasks.map(task => (
                                            <motion.div
                                                key={task.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                onDoubleClick={(e) => {
                                                    if (isReadOnly) return
                                                    e.stopPropagation()
                                                    setEditingTask(task)
                                                    setIsCreateModalOpen(true)
                                                }}
                                                onClick={(e) => {
                                                    if (isReadOnly) {
                                                        e.stopPropagation()
                                                        setViewingTask(task)
                                                        setIsDetailModalOpen(true)
                                                    }
                                                }}
                                                className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group/task hover:border-indigo-200 transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                    <IconRenderer iconKey={task.icon_key} className="text-lg w-6 h-6 flex items-center justify-center bg-gray-50 rounded-md" />
                                                    {task.template_id && <RefreshCw size={12} className="text-gray-400 opacity-60 flex-shrink-0" />}
                                                    <span className="text-xs font-medium text-gray-700 truncate">{task.title}</span>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {task.status === 'approved' && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                                                    {task.status === 'waiting_approval' && <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm" />}
                                                    {task.status === 'pending' && <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm" />}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>


                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Sidebar Stats & Details */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
                {/* Selected Day Detail */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 flex-1">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                        משימות ל - {format(selectedDay, 'EEEE', { locale: he })}
                    </h3>

                    {
                        getTasksForDay(selectedDay).length > 0 ? (
                            <div className="space-y-3">
                                {getTasksForDay(selectedDay).map(task => (
                                    <div
                                        key={task.id}
                                        onDoubleClick={() => {
                                            if (isReadOnly) return
                                            setEditingTask(task)
                                            setIsCreateModalOpen(true)
                                        }}
                                        onClick={(e) => {
                                            if (isReadOnly) {
                                                e.stopPropagation()
                                                setViewingTask(task)
                                                setIsDetailModalOpen(true)
                                            }
                                        }}
                                        className="p-3 bg-gray-50 rounded-xl flex items-start gap-3 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex-shrink-0 bg-white p-1 rounded-lg shadow-sm w-10 h-10 flex text-2xl flex-col justify-center items-center">
                                            <IconRenderer iconKey={task.icon_key} className="text-2xl object-cover" size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                                                {task.template_id && <RefreshCw size={12} className="text-gray-400 opacity-70 flex-shrink-0" />}
                                                {task.title}
                                            </h4>
                                            {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100 flex items-center gap-1">
                                                    {task.stars_value} <Star size={10} className="fill-yellow-600" />
                                                </span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${task.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    task.status === 'waiting_approval' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-200 text-gray-600'
                                                    }`}>
                                                    {task.status === 'approved' ? 'אושר' :
                                                        task.status === 'waiting_approval' ? 'ממתין לאישור הורים' : 'טרם בוצע'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {!isReadOnly ? (
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="mt-4 text-indigo-600 text-sm font-medium hover:underline"
                                    >
                                        + הוסף משימה
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsChildCreateModalOpen(true)}
                                        className="mt-4 text-indigo-600 text-sm font-medium hover:underline"
                                    >
                                        + הוסף משימה שלי
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">אין משימות ליום זה</p>
                                {!isReadOnly ? (
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="mt-4 text-indigo-600 text-sm font-medium hover:underline"
                                    >
                                        + הוסף משימה
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsChildCreateModalOpen(true)}
                                        className="mt-4 text-indigo-600 text-sm font-medium hover:underline"
                                    >
                                        + הוסף משימה שלי
                                    </button>
                                )}
                            </div>
                        )
                    }
                </div >

                {/* Gamification Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 sticky top-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900">התקדמות שבועית</h3>
                        <Trophy className={weeklyStats.percentage === 100 ? "text-yellow-500 animate-bounce" : "text-gray-300"} size={22} />
                    </div>

                    <div className="flex flex-col items-center mb-6">
                        <CircularProgress percentage={weeklyStats.percentage} />
                        <div className="mt-4 text-center">
                            <p className="text-2xl font-bold text-gray-900">{weeklyStats.completed}/{weeklyStats.total}</p>
                            <p className="text-xs text-gray-500">משימות הושלמו</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100/50">
                        <p className="text-sm text-indigo-800 text-center font-medium leading-relaxed">
                            {getMotivationMessage(weeklyStats.percentage)}
                        </p>
                    </div>
                </div >


            </div >

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false)
                    setEditingTask(null)
                }}
                childId={childId}
                initialDate={format(selectedDay, 'yyyy-MM-dd')}
                task={editingTask}
                onSuccess={() => {
                    handleTaskAdded()
                }}
            />

            <CreateChildTaskModal
                isOpen={isChildCreateModalOpen}
                onClose={() => setIsChildCreateModalOpen(false)}
                childId={childId}
                initialDate={format(selectedDay, 'yyyy-MM-dd')}
                onSuccess={handleTaskAdded}
            />

            <ChildTaskDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                task={viewingTask}
                onSuccess={handleTaskAdded}
            />
        </div >
    )
}

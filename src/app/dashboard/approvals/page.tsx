'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { Check, X, Clock, Star, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { useUserPreferences } from '@/contexts/UserContext'

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

const DualSwipeButton = ({ onApprove, onReject }: { onApprove: () => void, onReject: () => void }) => {
    const trackRef = useRef<HTMLDivElement>(null)
    const handleRef = useRef<HTMLDivElement>(null)
    const x = useMotionValue(0)
    const controls = useAnimation()
    const [isCompleted, setIsCompleted] = useState(false)
    const [maxDrag, setMaxDrag] = useState(0)

    useEffect(() => {
        if (trackRef.current && handleRef.current) {
            const trackWidth = trackRef.current.offsetWidth
            const handleWidth = handleRef.current.offsetWidth
            setMaxDrag((trackWidth / 2) - (handleWidth / 2) - 4)
        }
    }, [])

    const backgroundColor = useTransform(
        x,
        [-maxDrag, 0, maxDrag],
        ['#22c55e', '#f3f4f6', '#ef4444']
    )

    const opacityApprove = useTransform(x, [0, -maxDrag * 0.5], [0, 1])
    const opacityReject = useTransform(x, [0, maxDrag * 0.5], [0, 1])
    const opacityCenter = useTransform(x, [-maxDrag * 0.2, 0, maxDrag * 0.2], [0, 1, 0])

    const handleDragEnd = async () => {
        if (isCompleted) return
        const threshold = maxDrag * 0.7

        if (x.get() <= -threshold) {
            setIsCompleted(true)
            await controls.start({ x: -maxDrag, transition: { duration: 0.2 } })
            onApprove()
        } else if (x.get() >= threshold) {
            setIsCompleted(true)
            await controls.start({ x: maxDrag, transition: { duration: 0.2 } })
            onReject()
        } else {
            controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } })
        }
    }

    if (isCompleted) {
        return (
            <div className="w-full bg-gray-100 h-14 rounded-2xl flex items-center justify-center mt-2">
                <span className="animate-spin w-6 h-6 border-4 border-indigo-400 border-t-indigo-600 rounded-full" />
            </div>
        )
    }

    return (
        <motion.div
            ref={trackRef}
            style={{ backgroundColor }}
            className="w-full h-14 rounded-2xl relative flex items-center justify-center mt-2 overflow-hidden shadow-inner select-none transition-colors"
            dir="ltr"
        >
            <motion.div style={{ opacity: opacityApprove }} className="absolute right-6 font-bold text-white flex items-center gap-2" dir="rtl">
                <Check size={20} />
                <span>אשר</span>
            </motion.div>

            <motion.div style={{ opacity: opacityReject }} className="absolute left-6 font-bold text-white flex items-center gap-2" dir="rtl">
                <X size={20} />
                <span>החזר לביצוע</span>
            </motion.div>

            <motion.div style={{ opacity: opacityCenter }} className="absolute font-bold text-gray-400 text-sm pointer-events-none" dir="rtl">
                החלק לאישור או דחייה
            </motion.div>

            <motion.div
                ref={handleRef}
                drag="x"
                dragConstraints={{ left: -maxDrag, right: maxDrag }}
                dragElastic={0.1}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                style={{ x }}
                animate={controls}
                whileDrag={{ scale: 1.15 }}
                className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center absolute z-10 cursor-grab active:cursor-grabbing"
            >
                <GripVertical className="text-gray-400" size={20} />
            </motion.div>
        </motion.div>
    )
}

export default function ApprovalsPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const { userId, familyId } = useUserPreferences()

    useEffect(() => {
        if (familyId) fetchPendingApprovals()
    }, [familyId])

    async function fetchPendingApprovals() {
        setLoading(true)

        const { data } = await supabase
            .from('tasks')
            .select('*, profiles:assigned_to(full_name, avatar_url)')
            .eq('family_id', familyId)
            .eq('status', 'waiting_approval')
            .order('completed_at', { ascending: false })

        if (data) {
            setTasks(data as unknown as Task[])
        }
        setLoading(false)
    }

    async function handleApprove(taskId: string) {
        const { error } = await supabase
            .from('tasks')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: userId
            })
            .eq('id', taskId)

        if (!error) {
            fetchPendingApprovals()
        } else {
            alert('Error approving task: ' + error.message)
        }
    }

    async function handleReject(taskId: string) {
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

                            <div className="mt-2">
                                <DualSwipeButton
                                    onApprove={() => handleApprove(task.id)}
                                    onReject={() => handleReject(task.id)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

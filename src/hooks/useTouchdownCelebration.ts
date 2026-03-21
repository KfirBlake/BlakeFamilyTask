import { useState, useEffect } from 'react'
import { format, isSameWeek } from 'date-fns'
import { useUserPreferences } from '@/contexts/UserContext'

type TaskInfo = {
    status: 'pending' | 'waiting_approval' | 'approved' | string
}

export function useTouchdownCelebration(tasks: TaskInfo[], targetDate: Date = new Date(), userId?: string) {
    const [showTouchdown, setShowTouchdown] = useState(false)
    const { preferences } = useUserPreferences()

    useEffect(() => {
        if (!tasks || tasks.length === 0 || !preferences.settings_touchdown) return

        // Only trigger if we're examining the CURRENT calendar week
        const now = new Date()
        if (!isSameWeek(now, targetDate, { weekStartsOn: 0 })) return

        // Check if all are done (not pending)
        const allDone = tasks.every(t => t.status === 'completed' || t.status === 'waiting_approval' || t.status === 'approved')

        if (allDone) {
            const effectiveUserId = userId || (tasks[0] as any).assigned_to || 'unknown'
            const weekKey = `touchdown_${effectiveUserId}_${format(now, 'yyyy_ww')}`
            const lastTouchdown = localStorage.getItem(`last_touchdown_week_${effectiveUserId}`)

            if (lastTouchdown !== weekKey) {
                setShowTouchdown(true)
                localStorage.setItem(`last_touchdown_week_${effectiveUserId}`, weekKey)
            }
        }
    }, [tasks, targetDate, userId])

    return { showTouchdown, setShowTouchdown }
}

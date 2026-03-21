'use client'

import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useUserPreferences } from '@/contexts/UserContext'

type Params = {
    onComplete: () => void
    loading: boolean
    text?: string
}

export default function SwipeToComplete({ onComplete, loading, text = 'החלק לסיום המשימה' }: Params) {
    const trackRef = useRef<HTMLDivElement>(null)
    const handleRef = useRef<HTMLDivElement>(null)
    const x = useMotionValue(0)
    const controls = useAnimation()
    const [isCompleted, setIsCompleted] = useState(false)
    const [maxDrag, setMaxDrag] = useState(0)
    const { preferences } = useUserPreferences()

    useEffect(() => {
        if (trackRef.current && handleRef.current) {
            setMaxDrag(-(trackRef.current.offsetWidth - handleRef.current.offsetWidth - 8))
        }
    }, [])

    const backgroundColor = useTransform(
        x,
        [0, maxDrag],
        ['#e0e7ff', '#10b981']
    )

    const textColor = useTransform(
        x,
        [0, maxDrag],
        ['#4f46e5', '#ffffff']
    )

    const handleColor = useTransform(
        x,
        [0, maxDrag],
        ['#4f46e5', '#10b981']
    )

    const handleDragEnd = async (event: any, info: any) => {
        if (loading || isCompleted) return
        const threshold = maxDrag * 0.8
        if (x.get() < threshold) {
            setIsCompleted(true)
            await controls.start({ x: maxDrag, transition: { duration: 0.2 } })

            if (preferences.settings_sound) {
                try {
                    const audio = new Audio('/assets/sounds/success.mp3')
                    audio.play()
                } catch (e) {
                    // Ignore audio errors gracefully
                }
            }

            onComplete()
        } else {
            controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } })
        }
    }

    if (loading || isCompleted) {
        return (
            <div className="w-full bg-emerald-500 text-white font-black text-xl flex items-center justify-center gap-3 mt-4 h-16 rounded-full shadow-lg shadow-emerald-200 transition-all">
                <span className="animate-spin w-6 h-6 border-4 border-white/30 border-t-white rounded-full" />
            </div>
        )
    }

    return (
        <motion.div
            ref={trackRef}
            style={{ backgroundColor }}
            className="w-full h-16 rounded-full relative flex items-center mt-4 overflow-hidden shadow-inner"
            dir="rtl"
        >
            <motion.div style={{ color: textColor }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <span className="font-bold select-none text-base">{text}</span>
            </motion.div>

            <motion.div
                ref={handleRef}
                drag="x"
                dragConstraints={{ right: 0, left: maxDrag }}
                dragElastic={0}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                style={{ x }}
                animate={controls}
                className="w-14 h-14 bg-white rounded-full shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing absolute right-1 z-10"
            >
                <motion.div style={{ color: handleColor }}>
                    <Check size={32} strokeWidth={4} />
                </motion.div>
            </motion.div>
        </motion.div>
    )
}

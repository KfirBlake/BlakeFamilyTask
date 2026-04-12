'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { X } from 'lucide-react'
import { useUserPreferences } from '@/contexts/UserContext'

// Randomly select a gif
const GIFS = [
    '49ers-niners.gif', '49ers-sf49ers.gif', 'brock-purdy-49ers.gif',
    'call-all-49ers-faithful-let\'s-do-this-niner-empire.gif',
    'christian-mccaffrey-49ers.gif', 'cmc-christian-mccaffrey.gif',
    'george-kittle.gif', 'hottttt.gif', 'joe-montana-san-francisco49ers.gif',
    'san-francisco-49ers-flag.gif', 'san-francisco-49ers-san-francisco.gif',
    'san-francisco-49ers-sourdough-sam.gif'
]

type Props = {
    onClose: () => void
}

export default function TouchdownCelebration({ onClose }: Props) {
    const [gifSrc, setGifSrc] = useState('')
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const { preferences } = useUserPreferences()

    useEffect(() => {
        // Pick random gif
        const randomGif = GIFS[Math.floor(Math.random() * GIFS.length)]
        setGifSrc(`/assets/images/49ers/${randomGif}`)

        // Fire confetti
        if (preferences.settings_confetti) {
            import('canvas-confetti').then((mod) => {
                const confetti = mod.default;
                const end = Date.now() + 3500
                const colors = ['#AA0000', '#B3995D']

                    ; (function frame() {
                        confetti({
                            particleCount: 7,
                            angle: 60,
                        spread: 55,
                        origin: { x: 0 },
                        colors: colors
                    })
                    confetti({
                        particleCount: 7,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 },
                        colors: colors
                    })

                        if (Date.now() < end) {
                            requestAnimationFrame(frame)
                        }
                    }())
            })
        }

        // Play Sound
        if (preferences.settings_sound && audioRef.current) {
            audioRef.current.volume = 0.5
            audioRef.current.play().catch(e => console.error('Audio play failed:', e))
        }

        // Auto close after 6 seconds
        const timer = setTimeout(() => {
            onClose()
        }, 6000)

        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4">
                <audio ref={audioRef} src="/assets/sounds/49ers/san-francisco-49ers-foghorn.mp3" preload="auto" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-black/50 rounded-full transition-colors z-10 hover:scale-110"
                >
                    <X size={32} />
                </button>

                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -50 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-full max-w-2xl flex flex-col items-center"
                >
                    <div className="text-center mb-8 relative z-10 w-full px-4">
                        <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#B3995D] via-[#FFE28A] to-[#B3995D] filter tracking-tighter" style={{ filter: 'drop-shadow(0px 8px 12px rgba(170,0,0,0.9))' }}>
                            TOUCHDOWN!
                        </h1>
                        <p className="text-3xl sm:text-4xl font-black text-white mt-4 tracking-wide" style={{ textShadow: '0 4px 8px #AA0000' }}>
                            כל המשימות הושלמו!
                        </p>
                    </div>

                    {gifSrc && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="w-full sm:w-[80%] aspect-video relative rounded-3xl overflow-hidden border-4 border-[#B3995D] shadow-[0_0_80px_rgba(170,0,0,0.5)] z-0"
                        >
                            <img src={gifSrc} alt="49ers Touchdown" className="w-full h-full object-cover" />
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

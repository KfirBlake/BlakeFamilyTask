'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Star, Gift, ShoppingBag, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

type Reward = {
    id: string
    name: string
    description: string | null
    price: number
    icon_key: string
}

export default function ChildRewardsPage() {
    const [rewards, setRewards] = useState<Reward[]>([])
    const [balance, setBalance] = useState(0)
    const [childName, setChildName] = useState('')
    const [loading, setLoading] = useState(true)
    const [redeemingId, setRedeemingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            // Fetch Profile for Balance
            const { data: profile } = await supabase
                .from('profiles')
                .select('stars_balance, full_name, family_id')
                .eq('id', user.id)
                .single()

            if (profile) {
                setBalance(profile.stars_balance)
                setChildName(profile.full_name)

                // Fetch Rewards
                const { data: rewardsData } = await supabase
                    .from('rewards_store')
                    .select('*')
                    .eq('family_id', profile.family_id)
                    .order('price', { ascending: true })

                setRewards(rewardsData || [])
            }
        }
        setLoading(false)
    }

    async function handleRedeem(reward: Reward) {
        if (balance < reward.price) {
            setError('אין מספיק כוכבים... נסה לבצע עוד משימות! 💪')
            setTimeout(() => setError(null), 3000)
            return
        }

        setRedeemingId(reward.id)
        setError(null)
        setSuccessMsg(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Get family_id again or store it in state. Let's fetch context safely.
        const { data: profile } = await supabase.from('profiles').select('family_id').eq('id', user.id).single()
        if (!profile) return

        // 2. Insert Redemption
        const { error: redeemError } = await supabase
            .from('rewards_redemptions')
            .insert({
                family_id: profile.family_id,
                created_by: user.id,
                reward_id: reward.id
            })

        if (redeemError) {
            console.error('Redeem error:', redeemError)
            setError('משהו השתבש... נסה שוב.')
        } else {
            // Success!
            setBalance(prev => prev - reward.price) // Optimistic update
            setSuccessMsg(`תהנה! הזמנת את ${reward.name}`)
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#FF4500']
            })

            // Re-fetch to ensure sync
            fetchData()
        }

        setRedeemingId(null)
        setTimeout(() => setSuccessMsg(null), 5000)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        )
    }

    return (
        <div className="p-6 max-w-md mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-4 border-b border-gray-200/50">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">הפרסים שלי 🎁</h1>
                </div>
                <div className="flex flex-col items-end">
                    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-2xl font-black text-xl flex items-center gap-2 shadow-sm border border-yellow-200 animate-pulse">
                        {balance}
                        <span className="text-2xl">⭐</span>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-100 text-red-800 p-4 rounded-2xl mb-6 font-bold text-center border-2 border-red-200"
                    >
                        {error}
                    </motion.div>
                )}
                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-green-100 text-green-800 p-4 rounded-2xl mb-6 font-bold text-center border-2 border-green-200"
                    >
                        {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rewards Grid */}
            <div className="grid grid-cols-2 gap-4">
                {rewards.length > 0 ? (
                    rewards.map(reward => {
                        const canAfford = balance >= reward.price
                        const isRedeeming = redeemingId === reward.id

                        return (
                            <motion.div
                                key={reward.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`
                                    relative flex flex-col items-center p-4 rounded-3xl border-2 transition-all overflow-hidden
                                    ${canAfford ? 'bg-white border-indigo-100 shadow-lg' : 'bg-gray-100 border-gray-200 opacity-80 grayscale-[0.5]'}
                                `}
                            >
                                <div className="text-4xl mb-3 transform hover:scale-110 transition-transform cursor-default">
                                    {reward.icon_key || '🎁'}
                                </div>
                                <h3 className="font-bold text-gray-900 text-center mb-1 leading-tight">{reward.name}</h3>
                                <div className="text-xs text-gray-500 text-center mb-4 line-clamp-2 h-8 px-1">
                                    {reward.description}
                                </div>

                                <button
                                    onClick={() => handleRedeem(reward)}
                                    disabled={!canAfford || isRedeeming}
                                    className={`
                                        w-full py-2 px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition-all
                                        ${canAfford
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-200'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                                    `}
                                >
                                    {isRedeeming ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>
                                            {reward.price} <Star size={12} className="fill-current" />
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )
                    })
                ) : (
                    <div className="col-span-2 text-center py-20 opacity-50">
                        <ShoppingBag size={48} className="mx-auto mb-4" />
                        <h3 className="text-xl font-bold">החנות ריקה</h3>
                        <p>בקש מההורים להוסיף פרסים!</p>
                    </div>
                )}
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Star, Gift, ShoppingBag, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import IconRenderer from '@/components/ui/IconRenderer'
import { useUserPreferences } from '@/contexts/UserContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'

type Reward = {
    id: string
    name: string
    description: string | null
    price: number
    icon_key: string
}

type RewardPurchase = {
    id: string
    status: 'pending' | 'redeemed'
    purchased_at: string
    redeemed_at: string | null
    rewards_store: {
        id: string
        name: string
        icon_key: string
        description: string | null
    }
}

export default function ChildRewardsPage() {
    const [redeemingId, setRedeemingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const { preferences, userId, familyId } = useUserPreferences()
    const supabase = createClient()
    const queryClient = useQueryClient()

    // Query 1: Child Profile (for balance & name)
    const { data: profile, isPending: profilePending } = useQuery({
        queryKey: ['profiles', 'balance', userId],
        queryFn: async () => {
            if (!userId) return null
            const { data } = await supabase
                .from('profiles')
                .select('stars_balance, full_name, family_id')
                .eq('id', userId)
                .single()
            return data
        },
        enabled: !!userId
    })

    const balance = profile?.stars_balance || 0
    const childName = profile?.full_name || ''

    // Query 2: Available Rewards Store
    const { data: rewards = [], isPending: rewardsPending } = useQuery({
        queryKey: ['rewards_store', familyId],
        queryFn: async () => {
            if (!familyId) return []
            const { data } = await supabase
                .from('rewards_store')
                .select('*')
                .eq('family_id', familyId)
                .order('price', { ascending: true })
            return data || []
        },
        enabled: !!familyId
    })

    // Query 3: Child's Purchases History
    const { data: purchases = [], isPending: purchasesPending } = useQuery<RewardPurchase[]>({
        queryKey: ['reward_purchases', userId],
        queryFn: async () => {
            if (!userId) return []
            const { data } = await supabase
                .from('reward_purchases')
                .select(`
                    id,
                    status,
                    purchased_at,
                    redeemed_at,
                    rewards_store:reward_id (
                        id,
                        name,
                        icon_key,
                        description
                    )
                `)
                .eq('child_id', userId)
                .order('purchased_at', { ascending: false })
            return (data as unknown as RewardPurchase[]) || []
        },
        enabled: !!userId
    })

    const loading = profilePending || rewardsPending || purchasesPending

    async function handleRedeem(reward: Reward) {
        if (balance < reward.price) {
            setError('אין מספיק כוכבים... נסה לבצע עוד משימות! 💪')
            setTimeout(() => setError(null), 3000)
            return
        }

        setRedeemingId(reward.id)
        setError(null)
        setSuccessMsg(null)

        if (!userId || !familyId) return

        // 2. Extract context - re-check balance in DB for security
        const { data: profile } = await supabase.from('profiles').select('family_id, stars_balance').eq('id', userId).single()
        if (!profile) return

        // 3. Ensure they actually have enough balance in DB
        if (profile.stars_balance < reward.price) {
            setError('אין מספיק כוכבים... נסה לבצע עוד משימות! 💪')
            setRedeemingId(null)
            return
        }

        // 4. Update Profile Balance explicitly
        await supabase
            .from('profiles')
            .update({ stars_balance: profile.stars_balance - reward.price })
            .eq('id', userId)

        // 5. Insert Redemption into new architecture
        const { error: redeemError } = await supabase
            .from('reward_purchases')
            .insert({
                child_id: userId,
                reward_id: reward.id,
                family_id: profile.family_id,
                status: 'pending'
            })

        if (redeemError) {
            console.error('Redeem error:', redeemError)
            setError('משהו השתבש... נסה שוב.')
        } else {
            // Success!
            queryClient.setQueryData(['profiles', 'balance', userId], (old: any) => {
                if (!old) return old
                return { ...old, stars_balance: old.stars_balance - reward.price }
            })
            setSuccessMsg(`תהנה! הזמנת את ${reward.name}`)

            if (preferences.settings_confetti) {
                import('canvas-confetti').then((mod) => {
                    const confetti = mod.default;
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#FFD700', '#FFA500', '#FF4500']
                    })
                })
            }

            // Sync with backend gracefully
            queryClient.invalidateQueries({ queryKey: ['profiles', 'balance', userId] })
            queryClient.invalidateQueries({ queryKey: ['reward_purchases', userId] })
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
                                <div className="w-12 h-12 mb-4 transform hover:scale-110 transition-transform cursor-default flex items-center justify-center text-4xl">
                                    <IconRenderer iconKey={reward.icon_key || '🎁'} className="w-full h-full object-cover" size={40} />
                                </div>
                                <h3 className="font-bold text-gray-900 text-center mb-1 leading-tight">{reward.name}</h3>
                                <div className="text-xs text-gray-500 text-center mb-4 line-clamp-2 h-8 px-1">
                                    {reward.description}
                                </div>
                                {!canAfford && (
                                    <div className="text-xs text-red-500 text-center mb-4">
                                        חסרים לך {reward.price - balance} כוכבים
                                    </div>
                                )}

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

            {/* Invetory: My Rewards Section */}
            {purchases.length > 0 && (
                <div className="mt-16">
                    <h2 className="text-2xl font-black text-gray-900 mb-6">המתנות שלי 🎁</h2>

                    {/* Pending Items */}
                    {purchases.filter(p => p.status === 'pending').length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-indigo-600 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                ממתין למימוש
                            </h3>
                            <div className="flex flex-col gap-3">
                                {purchases.filter(p => p.status === 'pending').map(purchase => (
                                    <div key={purchase.id} className="bg-white border-2 border-indigo-100 p-4 rounded-2xl shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl">
                                            <IconRenderer iconKey={purchase.rewards_store?.icon_key || '🎁'} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900">{purchase.rewards_store?.name}</h4>
                                            <p className="text-xs text-gray-500">נרכש ב-{new Date(purchase.purchased_at).toLocaleDateString('he-IL')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Redeemed Items */}
                    {purchases.filter(p => p.status === 'redeemed').length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                כבר מימשתי
                            </h3>
                            <div className="flex flex-col gap-3">
                                {purchases.filter(p => p.status === 'redeemed').map(purchase => (
                                    <div key={purchase.id} className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex items-center gap-4 opacity-75">
                                        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl grayscale">
                                            <IconRenderer iconKey={purchase.rewards_store?.icon_key || '🎁'} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-600 line-through decoration-gray-400">{purchase.rewards_store?.name}</h4>
                                            <p className="text-xs text-gray-400">מומש ב-{purchase.redeemed_at ? new Date(purchase.redeemed_at).toLocaleDateString('he-IL') : 'לא ידוע'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

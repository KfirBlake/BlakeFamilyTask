'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { Gift, Check, RotateCcw, Star } from 'lucide-react'
import IconRenderer from '@/components/ui/IconRenderer'
import SwipeToComplete from '@/components/child/SwipeToComplete'
import { useUserPreferences } from '@/contexts/UserContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'

type Purchase = {
    id: string
    status: 'pending' | 'redeemed' | 'cancelled' | 'rejected'
    purchased_at: string
    redeemed_at: string | null
    profiles: { full_name: string }
    rewards_store: { name: string, icon_key: string, price: number }
}

export default function PendingRewardsPage() {
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [rejectingPurchase, setRejectingPurchase] = useState<Purchase | null>(null)
    const [isRejecting, setIsRejecting] = useState(false)
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

    const supabase = createClient()
    const queryClient = useQueryClient()
    const { familyId } = useUserPreferences()

    const { data: purchases = [], isPending: loading } = useQuery<Purchase[]>({
        queryKey: ['reward_purchases', 'pending', familyId],
        queryFn: async () => {
            if (!familyId) return []
            const { data } = await supabase
                .from('reward_purchases')
                .select(`
                    id,
                    status,
                    purchased_at,
                    redeemed_at,
                    profiles:child_id ( full_name ),
                    rewards_store:reward_id ( name, icon_key, price )
                `)
                .eq('family_id', familyId)
                .eq('status', 'pending')
                .order('purchased_at', { ascending: false })

            return (data as unknown as Purchase[]) || []
        },
        enabled: !!familyId
    })

    async function handleMarkRedeemed(id: string) {
        setProcessingId(id)
        const { error } = await supabase
            .from('reward_purchases')
            .update({
                status: 'redeemed',
                redeemed_at: new Date().toISOString()
            })
            .eq('id', id)

        if (!error) {
            queryClient.invalidateQueries({ queryKey: ['reward_purchases'] })
        } else {
            console.error(error)
        }
        setProcessingId(null)
    }

    async function handleReject(purchase: Purchase) {
        setIsRejecting(true)
        setFeedback(null)

        try {
            const { data, error: rpcError } = await supabase
                .rpc('reject_reward_purchase', { p_purchase_id: purchase.id })

            if (rpcError) {
                console.error('Reject error:', rpcError)
                setFeedback({ message: 'שגיאה בדחיית הבקשה: ' + rpcError.message, type: 'error' })
            } else if (data && !data.success) {
                setFeedback({ message: data.error || 'שגיאה בדחיית הבקשה', type: 'error' })
            } else {
                const refunded = data?.refunded_stars ?? purchase.rewards_store?.price ?? 0
                setFeedback({
                    message: `הבקשה נדחתה ו-${refunded} כוכבים הוחזרו בהצלחה ל-${purchase.profiles?.full_name}! ⭐`,
                    type: 'success'
                })
                setRejectingPurchase(null)
                queryClient.invalidateQueries({ queryKey: ['reward_purchases'] })
                queryClient.invalidateQueries({ queryKey: ['familyOverview'] })
                queryClient.invalidateQueries({ queryKey: ['profiles'] })
            }
        } catch (err: any) {
            setFeedback({ message: err?.message || 'שגיאה לא צפויה', type: 'error' })
        } finally {
            setIsRejecting(false)
            setTimeout(() => setFeedback(null), 5000)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                <Gift className="text-indigo-600" />
                מתנות שממתינות למימוש
            </h1>

            {feedback && (
                <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in fade-in duration-150 ${
                    feedback.type === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    <span>{feedback.message}</span>
                </div>
            )}

            {loading ? (
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
                </div>
            ) : purchases.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
                    <Gift size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium text-lg">אין מתנות שממתינות כרגע.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {purchases.map(p => (
                        <div key={p.id} className="bg-white border-2 border-indigo-100 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-6 transition-all hover:shadow-md">
                            <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl">
                                <IconRenderer iconKey={p.rewards_store?.icon_key || '🎁'} />
                            </div>
                            <div className="flex-1 text-center sm:text-right">
                                <h4 className="font-bold text-gray-900 text-xl mb-1">{p.rewards_store?.name}</h4>
                                <div className="text-sm text-gray-500 font-medium flex flex-wrap gap-2 justify-center sm:justify-start items-center">
                                    <span className="bg-gray-100 text-gray-800 font-bold px-2 py-0.5 rounded-md">{p.profiles?.full_name}</span>
                                    {p.rewards_store?.price ? (
                                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            {p.rewards_store.price} <Star size={11} className="fill-indigo-600" />
                                        </span>
                                    ) : null}
                                    <span>נרכש ב: {new Date(p.purchased_at).toLocaleString('he-IL')}</span>
                                </div>
                            </div>
                            <div className="w-full sm:w-auto mt-4 sm:mt-0 flex items-center gap-3">
                                <button
                                    type="button"
                                    disabled={processingId === p.id}
                                    onClick={() => setRejectingPurchase(p)}
                                    className="px-4 py-3 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-sm transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50 active:scale-95"
                                    title="החזר כוכבים ודחה בקשה"
                                >
                                    <RotateCcw size={16} />
                                    <span>החזר / דחה</span>
                                </button>
                                <div className="flex-1 sm:w-60 min-w-[200px]">
                                    <SwipeToComplete
                                        onComplete={() => handleMarkRedeemed(p.id)}
                                        loading={processingId === p.id}
                                        text="החלק למימוש מתנה"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Confirmation Modal */}
            {rejectingPurchase && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-150">
                        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <RotateCcw size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">החזרת בקשת פרס</h3>
                        <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                            האם לדחות את בקשת הפרס <span className="font-bold text-gray-900">{rejectingPurchase.rewards_store?.name}</span> של <span className="font-bold text-gray-900">{rejectingPurchase.profiles?.full_name}</span>?
                        </p>
                        {rejectingPurchase.rewards_store?.price ? (
                            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full mb-6">
                                <span>{rejectingPurchase.rewards_store.price}</span>
                                <Star size={14} className="fill-yellow-400 text-yellow-500" />
                                <span>יוחזרו ליתרת הכוכבים של הילד</span>
                            </div>
                        ) : null}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={isRejecting}
                                onClick={() => setRejectingPurchase(null)}
                                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                            >
                                ביטול
                            </button>
                            <button
                                type="button"
                                disabled={isRejecting}
                                onClick={() => handleReject(rejectingPurchase)}
                                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isRejecting ? 'מבצע...' : 'כן, החזר כוכבים'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

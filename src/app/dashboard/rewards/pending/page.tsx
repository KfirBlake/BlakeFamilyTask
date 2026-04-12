'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Gift, Check } from 'lucide-react'
import IconRenderer from '@/components/ui/IconRenderer'
import SwipeToComplete from '@/components/child/SwipeToComplete'
import { useUserPreferences } from '@/contexts/UserContext'

type Purchase = {
    id: string
    status: 'pending' | 'redeemed'
    purchased_at: string
    redeemed_at: string | null
    profiles: { full_name: string }
    rewards_store: { name: string, icon_key: string, price: number }
}

import { useQuery, useQueryClient } from '@tanstack/react-query'

export default function PendingRewardsPage() {
    const [processingId, setProcessingId] = useState<string | null>(null)

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

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                <Gift className="text-indigo-600" />
                מתנות שממתינות למימוש
            </h1>

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
                                <p className="text-sm text-gray-500 font-medium flex gap-2 justify-center sm:justify-start">
                                    <span className="bg-gray-100 px-2 rounded-md">{p.profiles?.full_name}</span>
                                    <span>נרכש ב: {new Date(p.purchased_at).toLocaleString('he-IL')}</span>
                                </p>
                            </div>
                            <div className="w-full sm:w-auto mt-4 sm:mt-0 min-w-[240px]">
                                <SwipeToComplete
                                    onComplete={() => handleMarkRedeemed(p.id)}
                                    loading={processingId === p.id}
                                    text="החלק למימוש מתנה"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

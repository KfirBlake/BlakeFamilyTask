'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useMemo } from 'react'
import { Search, Filter, History, Star } from 'lucide-react'
import IconRenderer from '@/components/ui/IconRenderer'
import { useUserPreferences } from '@/contexts/UserContext'
import { useQuery } from '@tanstack/react-query'

type Purchase = {
    id: string
    status: 'pending' | 'redeemed' | 'cancelled' | 'rejected'
    purchased_at: string
    redeemed_at: string | null
    profiles: { full_name: string }
    rewards_store: { name: string, icon_key: string, price: number }
}

export default function HistoryRewardsPage() {
    // History Filters
    const [filterChild, setFilterChild] = useState('all')
    const [filterReward, setFilterReward] = useState('all')
    const [filterStatus, setFilterStatus] = useState<'all' | 'redeemed' | 'rejected' | 'cancelled'>('all')
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

    const supabase = createClient()
    const { familyId } = useUserPreferences()

    const { data: purchases = [], isPending: loading } = useQuery<Purchase[]>({
        queryKey: ['reward_purchases', 'history', familyId],
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
                .in('status', ['redeemed', 'rejected', 'cancelled'])
                .order('purchased_at', { ascending: false })

            return (data as unknown as Purchase[]) || []
        },
        enabled: !!familyId
    })

    const filteredHistory = useMemo(() => {
        let items = [...purchases]
        if (filterChild !== 'all') items = items.filter(p => p.profiles?.full_name === filterChild)
        if (filterReward !== 'all') items = items.filter(p => p.rewards_store?.name === filterReward)
        if (filterStatus !== 'all') items = items.filter(p => p.status === filterStatus)

        items.sort((a, b) => {
            const timeA = new Date(a.redeemed_at || a.purchased_at).getTime()
            const timeB = new Date(b.redeemed_at || b.purchased_at).getTime()
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB
        })

        return items
    }, [purchases, filterChild, filterReward, filterStatus, sortOrder])

    const childNames = Array.from(new Set(purchases.map(p => p.profiles?.full_name || '')))
    const rewardNames = Array.from(new Set(purchases.map(p => p.rewards_store?.name || '')))

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                <History className="text-indigo-600" />
                היסטוריית מתנות
            </h1>

            {loading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-16 bg-gray-100 rounded-2xl" />
                    <div className="h-40 bg-gray-100 rounded-2xl" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                            <Filter size={16} /> סינון:
                        </div>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as any)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm min-w-[140px] focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">כל הסטטוסים</option>
                            <option value="redeemed">מומש</option>
                            <option value="rejected">נדחה והוחזר</option>
                            <option value="cancelled">בוטל ע״י הילד</option>
                        </select>
                        <select
                            value={filterChild}
                            onChange={e => setFilterChild(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm min-w-[140px] focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">כל הילדים</option>
                            {childNames.filter(Boolean).map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                        <select
                            value={filterReward}
                            onChange={e => setFilterReward(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm min-w-[140px] focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">כל הפרסים</option>
                            {rewardNames.filter(Boolean).map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                        <select
                            value={sortOrder}
                            onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm min-w-[140px] mr-auto focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="desc">מהחדש לישן</option>
                            <option value="asc">מהישן לחדש</option>
                        </select>
                    </div>

                    {/* History Table/List */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        {filteredHistory.length === 0 ? (
                            <div className="text-center py-16 text-gray-500 bg-gray-50 flex flex-col items-center">
                                <Search size={40} className="mb-4 text-gray-300" />
                                אין היסטוריה תואמת לסינון.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredHistory.map(p => (
                                    <div key={p.id} className="p-5 flex items-center gap-5 hover:bg-gray-50 transition-colors">
                                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl grayscale opacity-70">
                                            <IconRenderer iconKey={p.rewards_store?.icon_key || '🎁'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-gray-800 text-lg truncate">{p.rewards_store?.name}</h4>
                                                {p.status === 'redeemed' && (
                                                    <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">
                                                        מומש
                                                    </span>
                                                )}
                                                {p.status === 'rejected' && (
                                                    <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                                                        נדחה והוחזר
                                                    </span>
                                                )}
                                                {p.status === 'cancelled' && (
                                                    <span className="text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                                                        בוטל ע״י הילד
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded-md">{p.profiles?.full_name}</p>
                                                {p.rewards_store?.price ? (
                                                    <span className="text-xs font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        {p.rewards_store.price} <Star size={10} className="fill-yellow-500" />
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="text-left bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 flex-shrink-0">
                                            <div className="text-sm font-bold text-gray-900">{new Date(p.redeemed_at || p.purchased_at).toLocaleDateString('he-IL')}</div>
                                            <div className="text-xs text-gray-500 font-medium">{new Date(p.redeemed_at || p.purchased_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

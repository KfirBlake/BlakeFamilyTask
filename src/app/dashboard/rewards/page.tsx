'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Plus, Gift, Trash2, Pencil } from 'lucide-react'
import IconRenderer from '@/components/ui/IconRenderer'
import IconPicker from '@/components/ui/IconPicker'
import { useUserPreferences } from '@/contexts/UserContext'

type Reward = {
    id: string
    name: string
    price: number
    icon_key: string
}

export default function RewardsPage() {
    const [rewards, setRewards] = useState<Reward[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingReward, setEditingReward] = useState<Reward | null>(null)

    const supabase = createClient()
    const { familyId } = useUserPreferences()

    useEffect(() => {
        if (familyId) fetchRewards()
    }, [familyId])

    async function fetchRewards() {
        setLoading(true)

        const { data } = await supabase
            .from('rewards_store')
            .select('*')
            .eq('family_id', familyId)
            .order('price', { ascending: true })

        if (data) setRewards(data)
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('האם אתה בטוח שברצונך למחוק פרס זה? חלק מהיסטוריית הרכישות עשויה להיפגע.')) return
        const { error } = await supabase.from('rewards_store').delete().eq('id', id)
        if (!error) fetchRewards()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">חנות הפרסים</h1>
                <button
                    onClick={() => {
                        setEditingReward(null)
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    הוסף פרס
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl" />)}
                </div>
            ) : rewards.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <Gift size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">החנות ריקה. הוסף פרסים כדי שהילדים יוכלו לקנות!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {rewards.map(reward => (
                        <div
                            key={reward.id}
                            onDoubleClick={() => setEditingReward(reward)}
                            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center relative group cursor-pointer hover:border-indigo-300 transition-colors select-none"
                        >
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingReward(reward) }}
                                    className="text-gray-300 hover:text-indigo-500 transition-colors"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(reward.id) }}
                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="w-12 h-12 mb-3 flex items-center justify-center text-4xl mt-3">
                                <IconRenderer iconKey={reward.icon_key || '🎁'} className="w-full h-full object-cover" size={40} />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">{reward.name}</h3>
                            <div className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
                                {reward.price} כוכבים
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(isModalOpen || editingReward) && (
                <RewardModal
                    reward={editingReward}
                    onClose={() => {
                        setIsModalOpen(false)
                        setEditingReward(null)
                    }}
                    onSuccess={fetchRewards}
                    supabase={supabase}
                    familyId={familyId}
                />
            )}
        </div >
    )
}

function RewardModal({ reward, onClose, onSuccess, supabase, familyId }: any) {
    const [name, setName] = useState(reward?.name || '')
    const [price, setPrice] = useState(reward?.price || 50)
    const [icon, setIcon] = useState(reward?.icon_key || '🎁')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        if (reward) {
            const { error } = await supabase.from('rewards_store').update({
                name,
                price,
                icon_key: icon
            }).eq('id', reward.id)

            setLoading(false)
            if (!error) {
                onSuccess()
                onClose()
            } else {
                alert(error.message)
            }
        } else {
            const { error } = await supabase.from('rewards_store').insert([
                {
                    family_id: familyId,
                    name,
                    price,
                    icon_key: icon
                }
            ])

            setLoading(false)
            if (!error) {
                onSuccess()
                onClose()
            } else {
                alert(error.message)
            }
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
                <h3 className="text-lg font-bold mb-4">{reward ? 'ערוך פרס' : 'הוסף פרס חדש'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">שם הפרס</label>
                        <input className="w-full border rounded-lg p-2" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">מחיר (כוכבים)</label>
                        <input className="w-full border rounded-lg p-2" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required />
                    </div>
                    <div>
                        <IconPicker selectedIcon={icon || '🎁'} onSelectIcon={setIcon} />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-500">ביטול</button>
                        <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold">
                            {loading ? 'שומר...' : 'שמור'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

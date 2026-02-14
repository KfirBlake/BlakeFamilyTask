'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Plus, User, Trash2 } from 'lucide-react'
import AddMemberModal from '@/components/members/AddMemberModal'

type Profile = {
    id: string
    full_name: string
    role: 'admin_parent' | 'parent' | 'child'
    avatar_url: string | null
    stars_balance: number
}

export default function FamilyMembersList() {
    const [members, setMembers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchMembers()
    }, [])

    async function fetchMembers() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: true })

        if (data) {
            setMembers(data)
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">חברי המשפחה</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} />
                    הוסף חבר
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
                        >
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                                {member.avatar_url ? (
                                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    member.full_name[0]
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">{member.full_name}</h3>
                                <p className="text-sm text-gray-500">
                                    {member.role === 'admin_parent' && 'מנהל משפחה'}
                                    {member.role === 'parent' && 'הורה'}
                                    {member.role === 'child' && 'ילד'}
                                </p>
                                {member.role === 'child' && (
                                    <div className="mt-1 inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-md text-xs font-medium">
                                        <span className="text-yellow-500">★</span> {member.stars_balance}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddMemberModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchMembers}
            />
        </div>
    )
}

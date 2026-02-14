'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ChildProfilePage() {
    const [profile, setProfile] = useState<any>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setProfile(data)
            }
        }
        fetchProfile()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (!profile) return <div className="p-8 text-center">טוען פרופיל...</div>

    return (
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-center text-white">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full mx-auto mb-4 flex items-center justify-center text-4xl border-4 border-white/30 shadow-lg">
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        profile.full_name?.charAt(0)
                    )}
                </div>
                <h1 className="text-2xl font-black">{profile.full_name}</h1>
                <p className="opacity-90">ילד/ה אלוף/ה! 🏆</p>
            </div>

            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600">
                            <span className="text-xl">⭐</span>
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-lg">{profile.stars_balance}</p>
                            <p className="text-xs text-gray-500">הכוכבים שלך</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 text-red-600 font-bold bg-red-50 hover:bg-red-100 p-4 rounded-2xl transition-colors"
                    >
                        <LogOut size={20} />
                        התנתק מהמערכת
                    </button>
                </div>
            </div>
        </div>
    )
}

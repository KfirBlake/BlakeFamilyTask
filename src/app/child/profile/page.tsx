'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AvatarUpload from '@/components/profile/AvatarUpload'
import ProfileForm from '@/components/profile/ProfileForm'
import StatsCard from '@/components/profile/StatsCard'

export default function ChildProfilePage() {
    const [profile, setProfile] = useState<any>(null)
    const [stats, setStats] = useState({ stars: 0, completed: 0 })
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*, date_of_birth')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setProfile(data)
                    // Fetch completed tasks count
                    const { count } = await supabase
                        .from('tasks')
                        .select('*', { count: 'exact', head: true })
                        .eq('assigned_to', user.id)
                        .eq('status', 'approved')

                    setStats({
                        stars: data.stars_balance || 0,
                        completed: count || 0
                    })
                }
            }
        }
        fetchProfile()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const handleAvatarUpdate = async (url: string) => {
        if (!profile) return

        // Update local state immediately
        setProfile((prev: any) => ({ ...prev, avatar_url: url }))

        // Update in database
        await supabase
            .from('profiles')
            .update({ avatar_url: url })
            .eq('id', profile.id)
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-bounce">
                    <span className="text-4xl">🚀</span>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
            <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 pb-24 relative">
                    <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 p-24 bg-indigo-900/10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>

                    <div className="relative z-10 text-center text-white">
                        <h1 className="text-3xl font-black mb-2">הפרופיל שלי</h1>
                        <p className="text-indigo-100 font-medium">איזה כיף שאת/ה כאן! 👋</p>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="relative z-20 -mt-20 px-6 pb-8">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
                        {/* Avatar Section */}
                        <div className="-mt-20 mb-6 flex justify-center">
                            <AvatarUpload
                                uid={profile.id}
                                url={profile.avatar_url}
                                onUpload={handleAvatarUpdate}
                            />
                        </div>

                        {/* Stats Section */}
                        <div className="mb-8">
                            <StatsCard stars={stats.stars} completedTasks={stats.completed} />
                        </div>

                        {/* Form Section */}
                        <div className="max-w-md mx-auto">
                            <ProfileForm initialData={profile} />
                        </div>

                        {/* Sign Out */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 hover:bg-red-100 p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <LogOut size={20} />
                                התנתק מהמערכת
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

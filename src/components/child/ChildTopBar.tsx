'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import Image from 'next/image'

export default function ChildTopBar() {
    const [profile, setProfile] = useState<any>(null)
    const [isBirthday, setIsBirthday] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setProfile(data)

                    // Check for birthday
                    if (data.date_of_birth) {
                        const today = new Date()
                        const dob = new Date(data.date_of_birth)

                        if (today.getDate() === dob.getDate() && today.getMonth() === dob.getMonth()) {
                            setIsBirthday(true)
                            // Trigger confetti
                            const confetti = (await import('canvas-confetti')).default
                            confetti({
                                particleCount: 150,
                                spread: 70,
                                origin: { y: 0.6 },
                                colors: ['#FFD700', '#FF69B4', '#00BFFF', '#32CD32']
                            })
                        }
                    }
                }
            }
        }

        fetchProfile()

        // Realtime subscription for balance updates
        const channel = supabase
            .channel('balance_updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                },
                (payload) => {
                    if (payload.new.id === profile?.id) {
                        setProfile(payload.new)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [profile?.id]) // Re-subscribe if ID changes (rare)

    if (!profile) {
        return (
            <header className="flex items-center justify-between px-6 py-4 bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100/50">
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex flex-col gap-1">
                        <div className="h-3 w-10 bg-gray-200 rounded"></div>
                        <div className="h-5 w-24 bg-gray-200 rounded"></div>
                    </div>
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </header>
        )
    }

    return (
        <header className="flex flex-col sticky top-0 z-40">
            {isBirthday && (
                <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-center py-2 text-sm font-bold animate-pulse">
                    🎉 מזל טוב! היום יום הולדת שמח! 🎂
                </div>
            )}
            <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all md:px-8">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 md:w-12 md:h-12 transition-all">
                        {/* Avatar Logic: If avatar_url exists use it, else initials */}
                        {profile.avatar_url ? (
                            <Image
                                src={profile.avatar_url}
                                alt={profile.full_name}
                                fill
                                className="rounded-full object-cover border-2 border-white shadow-md"
                            />
                        ) : (
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-md text-lg">
                                {profile.full_name?.charAt(0)}
                            </div>
                        )}
                        {isBirthday && (
                            <div className="absolute -top-2 -right-2 text-xl animate-bounce">
                                👑
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 font-medium leading-none">היי,</span>
                        <span className="text-lg md:text-xl font-black text-gray-900 leading-tight">{profile.display_name || profile.full_name}</span>
                    </div>
                </div>

                <div className="bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full font-black text-sm flex items-center gap-1.5 shadow-sm transform hover:scale-105 transition-transform cursor-default md:text-base md:px-5 md:py-2">
                    <span className="text-lg md:text-xl">{profile.stars_balance}</span>
                    <Star size={20} className="fill-yellow-100 text-yellow-800" />
                </div>
            </div>
        </header>
    )
}

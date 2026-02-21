'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import AvatarUpload from '@/components/profile/AvatarUpload'
import ProfileForm from '@/components/profile/ProfileForm'
import { UserCircle } from 'lucide-react'

export default function ParentProfilePage() {
    const [profile, setProfile] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*, date_of_birth') // Fetch DOB as well
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setProfile(data)
                }
            }
        }
        fetchProfile()
    }, [])

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
            <div className="flex items-center justify-center h-full min-h-[500px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                        <UserCircle size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">הפרופיל שלי</h1>
                        <p className="text-gray-500">ניהול פרטים אישיים והגדרות חשבון</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Sidebar / Avatar Column */}
                    <div className="md:col-span-1 flex flex-col items-center space-y-4">
                        <AvatarUpload
                            uid={profile.id}
                            url={profile.avatar_url}
                            onUpload={handleAvatarUpdate}
                        />
                        <div className="text-center">
                            <h2 className="text-lg font-bold text-gray-900">{profile.display_name || profile.full_name}</h2>
                            <p className="text-sm text-gray-500">
                                {profile.role === 'admin_parent' ? 'מנהל משפחה' : 'הורה'}
                            </p>
                        </div>
                    </div>

                    {/* Main Form Column */}
                    <div className="md:col-span-2">
                        <ProfileForm initialData={profile} />
                    </div>
                </div>
            </div>
        </div>
    )
}

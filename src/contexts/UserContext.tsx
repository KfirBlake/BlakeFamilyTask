'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'

type UserPreferences = {
    settings_sound: boolean
    settings_confetti: boolean
    settings_touchdown: boolean
    settings_dark_mode: boolean
}

type UserContextType = {
    preferences: UserPreferences
    updatePreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>
    loading: boolean
}

const defaultPreferences: UserPreferences = {
    settings_sound: true,
    settings_confetti: true,
    settings_touchdown: true,
    settings_dark_mode: false,
}

const UserContext = createContext<UserContextType>({
    preferences: defaultPreferences,
    updatePreferences: async () => { },
    loading: true
})

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        let mounted = true

        async function fetchPrefs() {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) {
                if (mounted) setLoading(false)
                return
            }

            const { data } = await supabase
                .from('profiles')
                .select('settings_sound, settings_confetti, settings_touchdown, settings_dark_mode')
                .eq('id', session.user.id)
                .single()

            if (data && mounted) {
                setPreferences({
                    settings_sound: data.settings_sound ?? true,
                    settings_confetti: data.settings_confetti ?? true,
                    settings_touchdown: data.settings_touchdown ?? true,
                    settings_dark_mode: data.settings_dark_mode ?? false,
                })
            }
            if (mounted) setLoading(false)
        }

        fetchPrefs()

        return () => { mounted = false }
    }, [])

    useEffect(() => {
        // Apply dark mode class globally when preference dynamically changes
        if (preferences.settings_dark_mode) {
            document.documentElement.classList.add('dark')
            document.body.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
            document.body.classList.remove('dark')
        }
    }, [preferences.settings_dark_mode])

    const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Optimistic UI update
        setPreferences(prev => ({ ...prev, ...newPrefs }))

        // Background DB sync
        await supabase
            .from('profiles')
            .update(newPrefs)
            .eq('id', user.id)
    }

    return (
        <UserContext.Provider value={{ preferences, updatePreferences, loading }}>
            {children}
        </UserContext.Provider>
    )
}

export const useUserPreferences = () => useContext(UserContext)

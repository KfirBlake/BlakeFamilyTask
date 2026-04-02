'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'

// Prevent double-init in StrictMode
let oneSignalInitRequested = false

type UserPreferences = {
    settings_sound: boolean
    settings_confetti: boolean
    settings_touchdown: boolean
    settings_dark_mode: boolean
}

type UserContextType = {
    userId: string | null
    familyId: string | null
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
    userId: null,
    familyId: null,
    preferences: defaultPreferences,
    updatePreferences: async () => { },
    loading: true
})

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
    const [userId, setUserId] = useState<string | null>(null)
    const [familyId, setFamilyId] = useState<string | null>(null)
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
                .select('family_id, settings_sound, settings_confetti, settings_touchdown, settings_dark_mode')
                .eq('id', session.user.id)
                .single()

            if (data && mounted) {
                setUserId(session.user.id)
                setFamilyId(data.family_id ?? null)
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

    useEffect(() => {
        const initOneSignal = async () => {
            if (oneSignalInitRequested) return
            oneSignalInitRequested = true

            const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
            if (!appId) {
                console.warn('OneSignal App ID missing from env')
                return
            }

            try {
                const OS = await import('react-onesignal')
                const OneSignal = OS.default || OS

                await OneSignal.init({
                    appId,
                    allowLocalhostAsSecureOrigin: true,
                })

                await OneSignal.Slidedown.promptPush()
            } catch (error) {
                console.error('Error initializing OneSignal:', error)
            }
        }

        initOneSignal()
    }, [])

    useEffect(() => {
        if (!userId) return

        const loginOneSignal = async () => {
            try {
                const OS = await import('react-onesignal')
                const OneSignal = OS.default || OS
                if (OneSignal.login) {
                    await OneSignal.login(userId)
                }
            } catch (error) {
                console.error('Error logging into OneSignal:', error)
            }
        }

        loginOneSignal()
    }, [userId])

    const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
        if (!userId) return

        // Optimistic UI update
        setPreferences(prev => ({ ...prev, ...newPrefs }))

        // Background DB sync
        await supabase
            .from('profiles')
            .update(newPrefs)
            .eq('id', userId)
    }

    return (
        <UserContext.Provider value={{ userId, familyId, preferences, updatePreferences, loading }}>
            {children}
        </UserContext.Provider>
    )
}

export const useUserPreferences = () => useContext(UserContext)

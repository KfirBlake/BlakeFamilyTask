'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'

// Module-level flag to prevent double-init across React StrictMode double-invocations
let oneSignalInitialized = false

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
    const supabase = createClient()
    const queryClient = useQueryClient()

    const { data: sessionUser, isPending: sessionPending } = useQuery({
        queryKey: ['session_user'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession()
            return session?.user || null
        }
    })

    const userId = sessionUser?.id || null

    const { data: profile, isPending: profilePending } = useQuery({
        queryKey: ['profiles', userId, 'preferences'],
        queryFn: async () => {
            if (!userId) return null
            const { data } = await supabase
                .from('profiles')
                .select('family_id, settings_sound, settings_confetti, settings_touchdown, settings_dark_mode')
                .eq('id', userId)
                .single()
            return data
        },
        enabled: !!userId
    })

    const preferences = profile ? {
        settings_sound: profile.settings_sound ?? true,
        settings_confetti: profile.settings_confetti ?? true,
        settings_touchdown: profile.settings_touchdown ?? true,
        settings_dark_mode: profile.settings_dark_mode ?? false,
    } : defaultPreferences

    const familyId = profile?.family_id ?? null
    const loading = sessionPending || (!!userId && profilePending)

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
        // Run OneSignal init + permission prompt on every page load.
        // The login(userId) step runs immediately after init if the user is already known,
        // ensuring external_id is always set in the same sequential flow.
        const setupOneSignal = async () => {
            const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
            if (!appId) {
                console.warn('OneSignal App ID missing from env')
                return
            }

            try {
                const OS = await import('react-onesignal')
                const OneSignal = OS.default || OS

                if (!oneSignalInitialized) {
                    oneSignalInitialized = true
                    await OneSignal.init({
                        appId,
                        allowLocalhostAsSecureOrigin: true,
                    })
                }

                // optIn() handles all cases:
                //  - permission = 'default' → shows the native browser dialog
                //  - permission = 'granted' → silently creates/repairs the subscription
                //  - permission = 'denied'  → does nothing
                // This is the correct fix when users granted permission but
                // no OneSignal subscription exists (e.g. after a Site URL change).
                if (typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
                    try {
                        await OneSignal.User.PushSubscription.optIn()
                        console.log('[OneSignal] PushSubscription optIn called, permission:', Notification.permission)
                    } catch {
                        // optIn() can fail on unsupported browsers — safely ignore
                    }
                }

                // Link the Supabase user ID as OneSignal external_id so the Edge
                // Function can target users by their Supabase UUID
                if (userId) {
                    await OneSignal.login(userId)
                    console.log('[OneSignal] Logged in as', userId)
                }
            } catch (error) {
                console.error('OneSignal setup error:', error)
            }
        }

        setupOneSignal()
    }, [userId]) // Re-run whenever userId changes (covers login AND initial load)

    const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
        if (!userId) return

        // Optimistic UI update using QueryClient
        queryClient.setQueryData(['profiles', userId, 'preferences'], (old: any) => {
            if (!old) return old
            return { ...old, ...newPrefs }
        })

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

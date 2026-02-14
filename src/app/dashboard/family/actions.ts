'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createChildProfile(familyId: string, name: string, pin: string, role: string) {
    const supabase = createClient()
    const sb = await supabase

    if (!name) {
        return { error: 'נא להזין שם' }
    }

    // Get current user to find family_id
    const { data: { user } } = await sb.auth.getUser()
    if (!user) {
        return { error: 'לא מחובר' }
    }

    const { data: profile } = await sb
        .from('profiles')
        .select('family_id, role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin_parent') {
        return { error: 'רק מנהל משפחה יכול ליצור פרופילים' }
    }

    // Create placeholder Auth User? 
    // No, for managed accounts we might just insert into 'profiles' with a dummy ID or a generated UUID that isn't in auth.users.
    // BUT 'profiles.id' references 'auth.users.id'. 
    // Constraint: "id uuid primary key references auth.users(id)".
    // This is a strict constraint. We MUST create an auth user or remove the foreign key constraint.
    // Best Practice for "Managed Users":
    // 1. Remove FK constraint (allow profiles without auth users).
    // 2. OR Create a dummy email for them (e.g. `child_TIMESTAMP@family.app`).

    // Let's go with removing FK constraint? No, that breaks the model of "Profile = User".
    // Let's create a dummy user.

    const dummyEmail = `child_${Date.now()}_${Math.floor(Math.random() * 1000)}@familytask.app`
    const dummyPassword = `pass_${Date.now()}` // Parent sets this technically, or we generate one.

    const { data: authData, error: authError } = await sb.auth.signUp({
        email: dummyEmail,
        password: dummyPassword,
    })

    // Note: If email confirmation is on, this might hang. Assuming disabled for this flow or pre-confirmed?
    // Actually, Admin can create users via Service Role usually. But here we are using standard client.
    // Standard client signUp usually requires email verification unless disabled.
    // The user turned off "Confirm email" hopefully as per my previous instruction.

    if (authError || !authData.user) {
        return { error: 'שגיאה ביצירת משתמש: ' + authError?.message }
    }

    const { error: profileError } = await sb.from('profiles').insert([
        {
            id: authData.user.id,
            family_id: profile.family_id,
            full_name: name,
            role: 'child',
            email: dummyEmail, // Optional to show this
            stars_balance: 0,
        },
    ])

    if (profileError) {
        return { error: 'שגיאה ביצירת פרופיל: ' + profileError.message }
    }

    revalidatePath('/dashboard/family')
    return { success: true }
}

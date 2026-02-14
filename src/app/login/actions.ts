'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
    const supabase = createClient()
    const sb = await supabase

    // Validate fields
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'נא למלא את כל השדות' }
    }

    const { error } = await sb.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: 'שגיאה בהתחברות: ' + error.message }
    }

    const { data: { user } } = await sb.auth.getUser()

    if (user) {
        const { data: profile } = await sb
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        revalidatePath('/', 'layout')

        if (profile?.role === 'child') {
            redirect('/child/dashboard')
        } else {
            redirect('/dashboard')
        }
    } else {
        redirect('/login')
    }
}

export async function signup(formData: FormData) {
    const supabase = createClient()
    const sb = await supabase
    const origin = (await headers()).get('origin')

    // Validate fields
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const familyName = formData.get('familyName') as string
    const familyId = formData.get('familyId') as string // Optional

    if (!email || !password || !fullName || (!familyName && !familyId)) {
        return { error: 'נא למלא את כל השדות' }
    }

    // 1. Sign up the user
    const { data: authData, error: authError } = await sb.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    })

    if (authError || !authData.user) {
        let errorMessage = authError?.message || 'Unknown error';
        if (errorMessage.includes('Rate limit')) {
            errorMessage = 'נשלחו יותר מדי בקשות בזמן קצר. אנא נסה שוב מאוחר יותר או השתמש בכתובת אימייל אחרת.';
        } else if (errorMessage.includes('valid email')) {
            errorMessage = 'כתובת אימייל לא תקינה.';
        } else if (errorMessage.includes('already registered')) {
            errorMessage = 'משתמש זה כבר רשום במערכת.';
        }
        return { error: 'שגיאה בהרשמה: ' + errorMessage }
    }
    const userId = authData.user.id
    let targetFamilyId = familyId

    // 2. Create Family if not joining one
    if (!targetFamilyId) {
        const { data: familyData, error: familyError } = await sb
            .from('families')
            .insert([{ name: familyName, created_by: userId }])
            .select()
            .single()

        if (familyError || !familyData) {
            return { error: 'שגיאה ביצירת המשפחה: ' + familyError?.message }
        }
        targetFamilyId = familyData.id
    }

    // 3. Create Profile
    // Rule: If creating family (no familyId), role is admin_parent. 
    // If joining (has familyId), use provided role.

    const roleParam = formData.get('role') as string
    let role = 'admin_parent'

    if (familyId) {
        if (roleParam === 'child') {
            role = 'child'
        } else {
            role = 'parent'
        }
    } else {
        // Double check: if we created a family, we MUST be admin_parent
        role = 'admin_parent'
    }

    const { error: profileError } = await sb.from('profiles').insert([
        {
            id: userId,
            family_id: targetFamilyId,
            full_name: fullName,
            role: role,
            email: email,
            stars_balance: 0,
        },
    ])

    if (profileError) {
        return { error: 'שגיאה ביצירת הפרופיל: ' + profileError.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signout() {
    const supabase = createClient()
    const sb = await supabase
    await sb.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

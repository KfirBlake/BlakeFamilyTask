'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Validate fields
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'נא למלא את כל השדות' }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: 'שגיאה בהתחברות: ' + error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const origin = (await headers()).get('origin')

    // Validate fields
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const familyName = formData.get('familyName') as string

    if (!email || !password || !fullName || !familyName) {
        return { error: 'נא למלא את כל השדות' }
    }

    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    })

    if (authError || !authData.user) {
        return { error: 'שגיאה בהרשמה: ' + (authError?.message || 'Unknown error') }
    }

    const userId = authData.user.id

    // 2. Create Family
    // Note: RLS policy "Anyone can create a family" allows this.
    const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert([{ name: familyName }])
        .select()
        .single()

    if (familyError || !familyData) {
        // Cleanup if possible, or just fail. 
        // Ideally we'd use a transaction but via client it's harder.
        // For now returning error.
        return { error: 'שגיאה ביצירת המשפחה: ' + familyError?.message }
    }

    // 3. Create Admin Profile
    // Note: RLS policy "Insert own profile" allows this.
    const { error: profileError } = await supabase.from('profiles').insert([
        {
            id: userId,
            family_id: familyData.id,
            full_name: fullName,
            role: 'admin_parent',
            email: email,
            // Default stars_balance is 0
        },
    ])

    if (profileError) {
        return { error: 'שגיאה ביצירת הפרופיל: ' + profileError.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

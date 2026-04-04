import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ReactNode } from 'react'
import ChildSidebar from '@/components/child/ChildSidebar'

export default async function ChildLayout({
    children,
}: {
    children: ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, families(name, image_url)')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'child') {
        redirect('/dashboard')
    }

    const family = profile.families as any

    return (
        <ChildSidebar family={family}>
            {children}
        </ChildSidebar>
    )
}

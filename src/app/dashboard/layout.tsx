import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    let userProfile = null

    if (user) {
        const { data } = await (await supabase)
            .from('profiles')
            .select('full_name, role, families(name, image_url)')
            .eq('id', user.id)
            .single()

        userProfile = {
            ...data,
            family: data?.families
        } as any

        if (userProfile?.role === 'child') {
            redirect('/child/dashboard')
        }
    }

    return (
        <DashboardSidebar userProfile={userProfile}>
            {children}
        </DashboardSidebar>
    )
}

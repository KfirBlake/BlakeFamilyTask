import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ReactNode } from 'react'
import ChildNavbar from '@/components/child/ChildNavbar'
import ChildSidebar from '@/components/child/ChildSidebar'
import ChildTopBar from '@/components/child/ChildTopBar'

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
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'child') {
        redirect('/dashboard')
    }

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans" dir="rtl">
            {/* Desktop Sidebar */}
            <ChildSidebar />

            <div className="flex-1 flex flex-col pb-24 md:pb-0">
                {/* Mobile Top Bar */}
                <ChildTopBar />

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <ChildNavbar />
        </div>
    )
}

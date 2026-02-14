import WeeklyChildTaskCalendar from '@/components/tasks/WeeklyChildTaskCalendar'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ChildCalendarPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-black text-gray-900 mb-6 hidden md:block">היומן שלי 📅</h1>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <WeeklyChildTaskCalendar
                    childId={user.id}
                    isReadOnly={true}
                />
            </div>
        </div>
    )
}

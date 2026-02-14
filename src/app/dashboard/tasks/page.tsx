'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import WeeklyChildTaskCalendar from '@/components/tasks/WeeklyChildTaskCalendar'
import CreateTaskModal from '@/components/tasks/CreateTaskModal'

type Profile = {
    id: string
    full_name: string
    avatar_url: string | null
    role: string
}

export default function TasksPage() {
    const [children, setChildren] = useState<Profile[]>([])
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchChildren()
    }, [])

    async function fetchChildren() {
        // Determine my role first? Or just fetch family members who are children.
        // For now, fetch all 'child' role profiles in my family.
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get my family_id
        const { data: myProfile } = await supabase
            .from('profiles')
            .select('family_id, role')
            .eq('id', user.id)
            .single()

        if (myProfile) {
            const { data: kids } = await supabase
                .from('profiles')
                .select('*')
                .eq('family_id', myProfile.family_id)
                .eq('role', 'child')

            if (kids && kids.length > 0) {
                setChildren(kids)
                setSelectedChildId(kids[0].id)
            }
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">ניהול משימות</h1>
                {selectedChildId && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        משימה חדשה
                    </button>
                )}
            </div>

            {loading ? (
                <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ) : children.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-2">אין עדיין פרופילים של ילדים במשפחה.</p>
                    <p className="text-sm text-indigo-600">עבור לניהול משפחה כדי להוסיף ילדים.</p>
                </div>
            ) : (
                <>
                    {/* Child Selector Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {children.map(child => (
                            <button
                                key={child.id}
                                onClick={() => setSelectedChildId(child.id)}
                                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all
                  ${selectedChildId === child.id
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}
                `}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedChildId === child.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    {child.avatar_url ? <img src={child.avatar_url} className="w-full h-full rounded-full" /> : child.full_name[0]}
                                </div>
                                <span className="font-medium text-sm">{child.full_name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Calendar / List View */}
                    {selectedChildId && (
                        <WeeklyChildTaskCalendar
                            childId={selectedChildId}
                            childName={children.find(c => c.id === selectedChildId)?.full_name}
                            childAvatar={children.find(c => c.id === selectedChildId)?.avatar_url}
                            key={selectedChildId} // Force re-render on switch
                        />
                    )}

                    {selectedChildId && (
                        <CreateTaskModal
                            isOpen={isCreateModalOpen}
                            onClose={() => setIsCreateModalOpen(false)}
                            childId={selectedChildId}
                            onSuccess={() => {
                                // Trigger refresh in calendar (via event or just simple page refresh for MVP)
                                window.location.reload()
                                // Better: Pass a refresh trigger to TaskCalendar, but reload is robust for MVP
                            }}
                        />
                    )}
                </>
            )}
        </div>
    )
}

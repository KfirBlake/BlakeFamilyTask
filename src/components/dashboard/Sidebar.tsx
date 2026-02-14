'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    Star,
    Gift,
    Menu,
    X,
    LogOut,
    UserCircle
} from 'lucide-react'
import { signout } from '@/app/login/actions'
import clsx from 'clsx'

const navigation = [
    { name: 'לוח בקרה', href: '/dashboard', icon: LayoutDashboard },
    { name: 'ניהול משפחה', href: '/dashboard/family', icon: Users },
    { name: 'משימות', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'אישורים', href: '/dashboard/approvals', icon: Star },
    { name: 'חנות פרסים', href: '/dashboard/rewards', icon: Gift },
]

type Props = {
    children: React.ReactNode
    userProfile?: {
        full_name: string | null
        role: string
    } | null
}

export default function DashboardSidebar({ children, userProfile }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={clsx(
                "fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:flex-col",
                sidebarOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                            <Star size={20} fill="currentColor" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">FamilyTask</span>
                    </Link>
                    <button
                        type="button"
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* User Info Section */}
                {userProfile && (
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                                <UserCircle size={24} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                    {userProfile.full_name || 'משתמש'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {userProfile.role === 'admin_parent' ? 'מנהל משפחה' :
                                        userProfile.role === 'parent' ? 'הורה' : 'ילד'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                                )}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <form action={signout}>
                        <button
                            type="submit"
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={20} />
                            התנתק
                        </button>
                    </form>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 h-16 px-4">
                    <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-gray-900">FamilyTask</span>
                    <div className="w-6" /> {/* Spacer for centering */}
                </div>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

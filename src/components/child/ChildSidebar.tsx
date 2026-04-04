'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Gift, User, Menu, X, Star, LogOut } from 'lucide-react'
import clsx from 'clsx'
import FamilyMessageNode from '../dashboard/FamilyMessageNode'
import ChildTopBar from './ChildTopBar'
import { signout } from '@/app/login/actions'

interface ChildSidebarProps {
    family?: {
        name: string
        image_url?: string | null
    }
    children: React.ReactNode
}

const navItems = [
    {
        name: 'משימות להיום',
        href: '/child/dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'לוח המשימות',
        href: '/child/calendar',
        icon: CalendarDays,
    },
    {
        name: 'חנות המתנות',
        href: '/child/rewards',
        icon: Gift,
    },
    {
        name: 'הפרופיל שלי',
        href: '/child/profile',
        icon: User,
    },
]

export default function ChildSidebar({ family, children }: ChildSidebarProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()
    const familyName = family?.name || 'FamilyTask'
    const familyImage = family?.image_url

    return (
        <div className="min-h-screen bg-gray-50 flex" dir="rtl">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={clsx(
                "fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-gray-200 transform transition-transform duration-200 ease-in-out flex flex-col overflow-y-auto overscroll-contain lg:translate-x-0 lg:static lg:inset-auto",
                sidebarOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header: logo + close button */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
                    <Link
                        href="/child/dashboard"
                        className="flex items-center gap-3"
                        onClick={() => setSidebarOpen(false)}
                    >
                        {familyImage ? (
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={familyImage} alt="Logo" className="object-cover w-full h-full" />
                            </div>
                        ) : (
                            <div className="bg-indigo-600 p-1.5 rounded-lg text-white flex-shrink-0">
                                <Star size={20} fill="currentColor" />
                            </div>
                        )}
                        <span className="text-xl font-bold text-gray-900 truncate">{familyName}</span>
                    </Link>
                    <button
                        type="button"
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                <FamilyMessageNode />

                {/* Nav links */}
                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
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

                {/* Sign out */}
                <div className="p-4 border-t border-gray-200 flex-shrink-0">
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

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile top bar: hamburger + child's star balance / name */}
                <div className="lg:hidden flex items-center bg-white border-b border-gray-200 h-16 px-4 gap-3">
                    <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    {/* Re-use ChildTopBar for name + stars — it fills remaining space */}
                    <div className="flex-1 min-w-0">
                        <ChildTopBar compact />
                    </div>
                </div>

                {/* Desktop: show ChildTopBar normally */}
                <div className="hidden lg:block">
                    <ChildTopBar />
                </div>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

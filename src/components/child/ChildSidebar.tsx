'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Gift, User } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ChildSidebar() {
    const pathname = usePathname()

    const navItems = [
        {
            name: 'משימות להיום',
            href: '/child/dashboard',
            icon: LayoutDashboard,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50'
        },
        {
            name: 'לוח המשימות',
            href: '/child/calendar',
            icon: CalendarDays,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            name: 'חנות המתנות',
            href: '/child/rewards',
            icon: Gift,
            color: 'text-pink-600',
            bgColor: 'bg-pink-50'
        },
        {
            name: 'הפרופיל שלי',
            href: '/child/profile',
            icon: User,
            color: 'text-teal-600',
            bgColor: 'bg-teal-50'
        }
    ]

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white border-l border-gray-200 h-screen sticky top-0 p-6">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    FT
                </div>
                <span className="text-2xl font-black text-gray-800 tracking-tight">FamilyTask</span>
            </div>

            <nav className="space-y-4 flex-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group overflow-hidden
                                ${isActive ? 'bg-gray-50' : 'hover:bg-gray-50'}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabSidebar"
                                    className="absolute inset-0 bg-gray-100 rounded-2xl"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <span className={`relative z-10 p-2 rounded-xl ${item.bgColor} ${item.color}`}>
                                <item.icon size={24} />
                            </span>
                            <span className={`relative z-10 font-bold text-lg ${isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}

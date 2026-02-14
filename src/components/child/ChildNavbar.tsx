'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Gift, User } from 'lucide-react'

export default function ChildNavbar() {
    const pathname = usePathname()

    // Assuming params like /child/dashboard or /child/rewards
    // Actually, Layout is just /child/layout.tsx
    // The URLs are /child/dashboard and /child/rewards

    const navItems = [
        {
            name: 'היום',
            href: '/child/dashboard',
            icon: LayoutDashboard,
            activeColor: 'text-indigo-600',
            bgActive: 'bg-indigo-50'
        },
        {
            name: 'יומן',
            href: '/child/calendar',
            icon: CalendarDays,
            activeColor: 'text-blue-600',
            bgActive: 'bg-blue-50'
        },
        {
            name: 'פרסים',
            href: '/child/rewards',
            icon: Gift,
            activeColor: 'text-pink-600',
            bgActive: 'bg-pink-50'
        },
        {
            name: 'אני',
            href: '/child/profile',
            icon: User,
            activeColor: 'text-teal-600',
            bgActive: 'bg-teal-50'
        }
    ]

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-safe-area shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-3xl z-50">
            <div className="flex justify-between items-center max-w-sm mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all w-16 
                                ${isActive ? '' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <div className={`relative p-2 rounded-xl transition-all ${isActive ? item.activeColor + ' ' + item.bgActive + ' -translate-y-4 shadow-lg scale-110 bg-white ring-4 ring-white' : ''}`}>
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[10px] font-bold transition-all ${isActive ? 'opacity-100 -translate-y-2 ' + item.activeColor : 'opacity-0 h-0 overflow-hidden'}`}>
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

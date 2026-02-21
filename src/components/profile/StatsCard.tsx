'use client'

import { Star, CheckCircle } from 'lucide-react'

interface StatsCardProps {
    stars: number
    completedTasks?: number
    className?: string
}

export default function StatsCard({ stars, completedTasks = 0, className = '' }: StatsCardProps) {
    return (
        <div className={`grid grid-cols-2 gap-4 ${className}`}>
            <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100 flex flex-col items-center justify-center text-center group hover:bg-yellow-100 transition-colors">
                <div className="bg-yellow-100 p-3 rounded-full mb-2 group-hover:bg-white transition-colors">
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                </div>
                <span className="text-3xl font-black text-gray-900">{stars}</span>
                <span className="text-sm font-medium text-yellow-700">כוכבים שצברת</span>
            </div>

            <div className="bg-green-50 rounded-2xl p-4 border border-green-100 flex flex-col items-center justify-center text-center group hover:bg-green-100 transition-colors">
                <div className="bg-green-100 p-3 rounded-full mb-2 group-hover:bg-white transition-colors">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <span className="text-3xl font-black text-gray-900">{completedTasks}</span>
                <span className="text-sm font-medium text-green-700">משימות שהושלמו</span>
            </div>
        </div>
    )
}

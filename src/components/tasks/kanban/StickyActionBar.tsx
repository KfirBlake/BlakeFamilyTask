'use client'

import { Star, Sparkles, RotateCcw, Check, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Props = {
    draftCount: number
    childrenCount: number
    totalWeeklyStars: number
    totalInstances: number
    isApplying: boolean
    onApply: () => void
    onReset: () => void
}

export default function StickyActionBar({
    draftCount,
    childrenCount,
    totalWeeklyStars,
    totalInstances,
    isApplying,
    onApply,
    onReset,
}: Props) {
    const hasDraft = draftCount > 0

    return (
        <div
            className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-2xl transition-all duration-300"
            dir="rtl"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Summary counters */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl transition-colors ${hasDraft ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-400'}`}>
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-900">
                                    {hasDraft ? (
                                        <>
                                            {draftCount} משימות מתוזמנות עבור {childrenCount} ילדים
                                        </>
                                    ) : (
                                        'הטיוטה ריקה (גררו משימות ללוח)'
                                    )}
                                </span>
                                {hasDraft && (
                                    <span className="hidden md:inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-bold">
                                        <Star size={12} fill="currentColor" className="text-amber-500" />
                                        {totalWeeklyStars} כוכבים
                                    </span>
                                )}
                            </div>
                            <span className="text-[11px] text-gray-400 block">
                                {hasDraft
                                    ? `סה״כ ${totalInstances} ביצועים יומיים מתוכננים לשבוע זה`
                                    : 'שבצו משימות מהבנק לילדים כדי להחיל אותן על לוח המשימות'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    {/* View Live Tasks */}
                    <Link
                        href="/dashboard/tasks"
                        className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <span>צפייה בלוח השבועי</span>
                        <ArrowLeft size={14} />
                    </Link>

                    {/* Reset Draft */}
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={!hasDraft || isApplying}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        title="איפוס כל השיבוצים בטיוטה"
                    >
                        <RotateCcw size={14} />
                        <span>איפוס טיוטה</span>
                    </button>

                    {/* Apply Weekly Schedule */}
                    <button
                        type="button"
                        onClick={onApply}
                        disabled={!hasDraft || isApplying}
                        className={`
                            flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md
                            ${hasDraft && !isApplying
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-98'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            }
                        `}
                    >
                        {isApplying ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>מחיל לוח שבועי...</span>
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                <span>החל לוח שבועי ({totalInstances} ביצועים)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

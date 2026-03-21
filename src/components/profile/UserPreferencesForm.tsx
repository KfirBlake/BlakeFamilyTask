'use client'

import { useUserPreferences } from '@/contexts/UserContext'
import { Volume2, PartyPopper, Trophy, Moon } from 'lucide-react'

export default function UserPreferencesForm() {
    const { preferences, updatePreferences, loading } = useUserPreferences()

    if (loading) return <div className="h-40 animate-pulse bg-gray-100 rounded-2xl w-full" />

    const Toggle = ({
        icon: Icon,
        label,
        description,
        checked,
        onChange
    }: {
        icon: any,
        label: string,
        description: string,
        checked: boolean,
        onChange: (val: boolean) => void
    }) => (
        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100/80 transition-colors shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${checked ? 'bg-indigo-100 text-indigo-600 shadow-inner' : 'bg-gray-200 text-gray-500'}`}>
                    <Icon size={24} />
                </div>
                <div className="flex flex-col text-right">
                    <span className="font-bold text-gray-900 leading-tight">{label}</span>
                    <span className="text-xs text-gray-500 mt-1">{description}</span>
                </div>
            </div>

            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-gray-300'}`}
                role="switch"
                aria-checked={checked}
            >
                <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? '-translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
    )

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-bold text-gray-900 border-b-4 border-indigo-400 pb-1 inline-block">התאם את החוויה שלך</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Toggle
                    icon={Volume2}
                    label="אפקטים קוליים"
                    description="צלילים בעת השלמת משימות"
                    checked={preferences.settings_sound}
                    onChange={(val) => updatePreferences({ settings_sound: val })}
                />
                <Toggle
                    icon={PartyPopper}
                    label="חגיגת קונפטי"
                    description="אנימציות ברכישת פרסים"
                    checked={preferences.settings_confetti}
                    onChange={(val) => updatePreferences({ settings_confetti: val })}
                />
                <Toggle
                    icon={Trophy}
                    label="חגיגת טאצ'דאון"
                    description="סרטון חגיגה בעת סיום משימות שבועיות"
                    checked={preferences.settings_touchdown}
                    onChange={(val) => updatePreferences({ settings_touchdown: val })}
                />
                <Toggle
                    icon={Moon}
                    label="מצב לילה"
                    description="עיצוב כהה לאור חלש במערכת הילדים"
                    checked={preferences.settings_dark_mode}
                    onChange={(val) => updatePreferences({ settings_dark_mode: val })}
                />
            </div>
        </div>
    )
}

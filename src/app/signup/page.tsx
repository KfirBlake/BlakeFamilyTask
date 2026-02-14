'use client'

import { signup } from '@/app/login/actions'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SignupForm() {
    const searchParams = useSearchParams()
    const familyId = searchParams.get('familyId')
    const role = searchParams.get('role') // 'parent' or 'child'
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        const result = await signup(formData)
        setLoading(false)
        if (result?.error) {
            setError(result.error)
        }
    }

    const roleText = role === 'child' ? 'ילד' : 'הורה'

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-gradient-to-br from-purple-100 to-pink-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-purple-500">
                <h1 className="text-3xl font-bold mb-2 text-center text-purple-700">
                    {familyId ? (role ? `הצטרפות כ${roleText}` : 'הצטרפות למשפחה') : 'יצירת משפחה חדשה'}
                </h1>
                <p className="text-center text-gray-500 mb-6 text-sm">
                    {familyId ? 'הכנס פרטים כדי להצטרף למשפחה' : 'התחל לנהל את המשימות המשפחתיות שלך בכיף!'}
                </p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form action={handleSubmit} className="flex flex-col gap-4">
                    {/* Hidden Family ID & Role */}
                    {familyId && <input type="hidden" name="familyId" value={familyId} />}
                    {role && <input type="hidden" name="role" value={role} />}

                    {!familyId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="familyName">
                                שם המשפחה
                            </label>
                            <input
                                id="familyName"
                                name="familyName"
                                type="text"
                                required={!familyId}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                placeholder="משפחת בנדי"
                            />
                        </div>
                    )}

                    {familyId && (
                        <div className="bg-purple-50 p-3 rounded-lg text-purple-700 text-sm font-medium text-center border border-purple-100">
                            מצטרף למשפחה קיימת {role && `בתור ${roleText}`}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fullName">
                            {familyId ? 'שם מלא' : 'שם הורה מנהל'}
                        </label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                            placeholder="אל בנדי"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                            אימייל
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                            placeholder="example@mail.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                            סיסמה
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                            placeholder="לפחות 6 תווים"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            familyId ? 'הצטרף' : 'צור משפחה'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    כבר רשום?{' '}
                    <a href="/login" className="text-purple-600 hover:text-purple-800 font-medium hover:underline">
                        התחבר כאן
                    </a>
                </div>
            </div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
            <SignupForm />
        </Suspense>
    )
}

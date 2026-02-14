'use client'

import { login, signup } from '@/app/login/actions'
import { useState } from 'react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        const result = await login(formData)
        setLoading(false)
        if (result?.error) {
            setError(result.error)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-gradient-to-br from-blue-100 to-indigo-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-indigo-500">
                <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700 font-sans">
                    כניסה למערכת
                </h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form action={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                            אימייל
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="********"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'התחבר'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    אין לך חשבון?{' '}
                    <a href="/signup" className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline">
                        הרשם כאן
                    </a>
                </div>
            </div>
        </div>
    )
}

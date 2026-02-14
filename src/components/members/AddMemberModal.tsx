'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, UserPlus, Baby } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { createChildProfile } from '@/app/dashboard/family/actions'

type Props = {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function AddMemberModal({ isOpen, onClose, onSuccess }: Props) {
    const [activeTab, setActiveTab] = useState<'invite' | 'create'>('invite')
    const [familyId, setFamilyId] = useState<string | null>(null)
    const [inviteLink, setInviteLink] = useState('')
    const [copied, setCopied] = useState(false)
    const [inviteRole, setInviteRole] = useState<'parent' | 'child'>('parent')
    const [linkLoading, setLinkLoading] = useState(false)

    // Child creation state
    const [childName, setChildName] = useState('')
    const [childPin, setChildPin] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        if (isOpen) {
            generateLink()
        }
    }, [isOpen, inviteRole])

    async function generateLink() {
        setLinkLoading(true)
        setError(null)

        try {
            let currentFamilyId = familyId

            if (!currentFamilyId) {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setError('לא נמצא משתמש מחובר')
                    setLinkLoading(false)
                    return
                }

                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('family_id')
                    .eq('id', user.id)
                    .maybeSingle()

                if (profileError) {
                    console.error('Profile fetch error:', profileError)
                    setError('שגיאה בטעינת פרופיל')
                    setLinkLoading(false)
                    return
                }

                if (!data?.family_id) {
                    setError('לא נמצא שיוך משפחתי. אנא פנה לתמיכה.')
                    setLinkLoading(false)
                    return
                }

                currentFamilyId = data.family_id
                setFamilyId(currentFamilyId)
            }

            if (currentFamilyId) {
                // Ensure origin is valid
                const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : ''
                const link = `${origin}/signup?familyId=${currentFamilyId}&role=${inviteRole}`
                setInviteLink(link)
            }
        } catch (err) {
            console.error('Error generating link:', err)
            setError('שגיאה ביצירת קישור')
        } finally {
            setLinkLoading(false)
        }
    }

    function handleCopy() {
        console.log('Copying link:', inviteLink)
        // Try standard API first
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(inviteLink)
                .then(() => showCopied())
                .catch((err) => {
                    console.error('Clipboard API failed', err)
                    fallbackCopy()
                })
        } else {
            fallbackCopy()
        }
    }

    function fallbackCopy() {
        console.log('Using fallback copy')
        // Fallback for non-secure contexts or older browsers
        const textArea = document.createElement("textarea")
        textArea.value = inviteLink

        // Ensure it's part of the DOM and not visible
        document.body.appendChild(textArea)
        textArea.style.position = "fixed"
        textArea.style.left = "-9999px"
        textArea.style.top = "0"

        textArea.focus()
        textArea.select()

        try {
            const successful = document.execCommand('copy')
            console.log('Fallback copy success:', successful)
            if (successful) showCopied()
            else console.error('Fallback copy command returned false')
        } catch (err) {
            console.error('Fallback Copy failed', err)
        }

        document.body.removeChild(textArea)
    }

    function showCopied() {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    async function handleCreateChild(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setChildName('') // Clear form
        setChildPin('')

        try {
            // Get current user to know which family to add to
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // We need to fetch the user's family_id again or use state
            // It's safer to fetch or use the one we already have in state if we trust it
            if (!familyId) {
                // Should not happen if generateLink ran, but just in case
                setError('Missing family ID')
                setLoading(false)
                return
            }

            const result = await createChildProfile(familyId, childName, childPin, 'child')

            if (result.error) {
                setError(result.error)
            } else {
                onSuccess()
                onClose()
            }
        } catch (err) {
            console.error(err)
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex border-b border-gray-100">
                    {/* Tabs ... */}
                    <button
                        onClick={() => setActiveTab('invite')}
                        className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'invite'
                            ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <UserPlus size={18} />
                            הזמן הורה/ילד
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'create'
                            ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Baby size={18} />
                            צור חשבון ילד
                        </div>
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'invite' ? (
                        <div className="space-y-4">
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-gray-900">קישור ההזמנה שלך</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    בחר את סוג המשתמש ושלח את הקישור להצטרפות.
                                </p>
                            </div>

                            {/* Role Selector */}
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setInviteRole('parent')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${inviteRole === 'parent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    הורה (בן/בת זוג)
                                </button>
                                <button
                                    onClick={() => setInviteRole('child')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${inviteRole === 'child' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    ילד (עם אימייל)
                                </button>
                            </div>

                            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <input
                                    readOnly
                                    value={inviteLink}
                                    className="flex-1 bg-transparent border-none text-sm text-gray-600 focus:ring-0 truncate dir-ltr select-all"
                                    onClick={(e) => e.currentTarget.select()}
                                />
                                <button
                                    onClick={handleCopy}
                                    className="p-2 hover:bg-white rounded-lg transition-colors text-indigo-600 shadow-sm"
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleCreateChild} className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">יצירת פרופיל לילד</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    צור פרופיל לילד ללא אימייל. הוא יוכל להיכנס באמצעות קוד אישי (PIN).
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">שם הילד</label>
                                <input
                                    type="text"
                                    required
                                    value={childName}
                                    onChange={(e) => setChildName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="לדוגמה: נועה"
                                />
                            </div>

                            {/* Note: PIN is just stored in metadata or separate table ideally. For MVP we might skip PIN auth or do a simple client-side check if we trust parent device. 
                  Actually, user wants "Create Managed Account".
                  We will create a profile. Login logic will be handled later.
              */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">תאור פרופיל (אופציונלי)</label>
                                <input
                                    type="text"
                                    value={childPin}
                                    onChange={(e) => setChildPin(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="משהו מזהה..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-70"
                            >
                                {loading ? 'יוצר...' : 'צור פרופיל'}
                            </button>
                        </form>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 font-medium text-sm px-4 py-2"
                    >
                        סגור
                    </button>
                </div>
            </div>
        </div>
    )
}

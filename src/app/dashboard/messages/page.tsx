'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useMemo } from 'react'
import { Loader2, Plus, RefreshCw, Search, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useUserPreferences } from '@/contexts/UserContext'

interface FamilyMessage {
    id: string
    message: string
    created_at: string
    created_by: string
}

export default function MessagesAdminPage() {
    const [newMessage, setNewMessage] = useState('')
    const [messages, setMessages] = useState<FamilyMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [settingActiveId, setSettingActiveId] = useState<string | null>(null)
    const supabase = createClient()
    const { userId, familyId } = useUserPreferences()

    useEffect(() => {
        if (familyId) fetchData()
    }, [familyId])

    const fetchData = async () => {
        setLoading(true)
        if (familyId) {
            await fetchMessages(familyId)
        }
        setLoading(false)
    }

    const fetchMessages = async (fId: string) => {
        const { data, error } = await supabase
            .from('family_messages')
            .select('*')
            .eq('family_id', fId)
            // We want to skip empty messages (clears) mostly, but let's fetch all and filter client side
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('שגיאה בטעינת היסטוריית הודעות')
        } else {
            // Filter out the 'clear' actions (empty strings) from history if desired, 
            // but we might want them. Let's filter them so the history table is only actual messages.
            const validMessages = (data as FamilyMessage[]).filter(m => m.message.trim() !== '')
            setMessages(validMessages)
        }
    }

    const handleSaveNewMessage = async () => {
        if (!familyId || !newMessage.trim()) return

        setSaving(true)

        const { error } = await supabase
            .from('family_messages')
            .insert({
                family_id: familyId,
                message: newMessage.trim(),
                created_by: userId
            })

        if (error) {
            toast.error('שגיאה ביצירת הודעה')
            console.error(error)
        } else {
            toast.success('הודעה חדשה נוספה! 📝')
            setNewMessage('')
            await fetchMessages(familyId) // Refresh list
        }
        setSaving(false)
    }

    const handleSetActive = async (messageText: string, id: string) => {
        if (!familyId) return

        setSettingActiveId(id)

        // Insert a new row with the old message content to make it the 'latest'
        const { error } = await supabase
            .from('family_messages')
            .insert({
                family_id: familyId,
                message: messageText,
                created_by: userId
            })

        if (error) {
            toast.error('שגיאה בהגדרת ההודעה כפעילה')
        } else {
            toast.success('ההודעה עודכנה כפעילה! ✨')
            await fetchMessages(familyId) // Refresh to show it at the top
        }
        setSettingActiveId(null)
    }

    const filteredMessages = useMemo(() => {
        if (!searchQuery.trim()) return messages
        return messages.filter(m =>
            m.message.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [messages, searchQuery])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[500px]">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-center gap-3 mb-2">
                <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600">
                    <MessageSquare size={28} />
                </div>
                <h1 className="text-3xl font-black text-gray-900">לוח הודעות משפחתי</h1>
            </div>
            <p className="text-gray-500 text-center mb-10">
                פרסמו הודעות שיקפצו לכל בני המשפחה, וצפו בהיסטוריית ההודעות.
            </p>

            {/* Create New Message Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">הודעה חדשה</h2>
                <div className="flex flex-col gap-4">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="w-full p-4 rounded-xl bg-yellow-50 border border-yellow-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 transition-all text-right font-medium min-h-[120px] resize-y"
                        placeholder="כתבו כאן הודעה, מעשה טוב, או תזכורת לכל המשפחה..."
                        dir="rtl"
                    />
                    <button
                        onClick={handleSaveNewMessage}
                        disabled={saving || !newMessage.trim()}
                        className="w-full md:w-auto self-end bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-3 px-8 rounded-xl shadow-lg shadow-yellow-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                        פרסם עכשיו
                    </button>
                </div>
            </div>

            {/* History Table Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-900">היסטוריית הודעות</h2>

                    <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="חיפוש בהודעות..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full md:w-64 pl-3 pr-10 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                            dir="rtl"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-right">
                        <thead>
                            <tr>
                                <th scope="col" className="px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-xl">
                                    הודעה
                                </th>
                                <th scope="col" className="px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                                    תאריך יצירה
                                </th>
                                <th scope="col" className="px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider w-32 rounded-tl-xl text-center">
                                    פעולות
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredMessages.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500 font-medium bg-gray-50/50 rounded-b-xl">
                                        {searchQuery ? 'לא נמצאו הודעות התואמות את החיפוש.' : 'אין עדיין הודעות בהיסטוריה.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredMessages.map((msg, idx) => {
                                    const isLatest = idx === 0 && !searchQuery; // Approximation of "currently active"

                                    return (
                                        <tr key={msg.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-pre-wrap text-sm font-medium text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    {msg.message}
                                                    {isLatest && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 shrink-0">
                                                            פעיל כעת
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                <button
                                                    onClick={() => handleSetActive(msg.message, msg.id)}
                                                    disabled={settingActiveId === msg.id || isLatest}
                                                    className={`
                                                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                                        ${isLatest
                                                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                            : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 cursor-pointer'}
                                                    `}
                                                    title="קבע כהודעה פעילה"
                                                >
                                                    {settingActiveId === msg.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="w-4 h-4" />
                                                    )}
                                                    <span className="hidden sm:inline">פרסם שוב</span>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

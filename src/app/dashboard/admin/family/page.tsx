'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useEffect } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import FamilyAssetsUpload from '@/components/family/FamilyAssetsUpload'
import { useUserPreferences } from '@/contexts/UserContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export default function FamilyAdminPage() {
    const [name, setName] = useState('')
    const [saving, setSaving] = useState(false)
    const supabase = createClient()
    const { familyId } = useUserPreferences()
    const queryClient = useQueryClient()

    const { data: family, isPending: loading } = useQuery({
        queryKey: ['family', familyId],
        queryFn: async () => {
            if (!familyId) return null
            const { data } = await supabase
                .from('families')
                .select('*')
                .eq('id', familyId)
                .single()
            return data
        },
        enabled: !!familyId,
    })

    // Populate name state when family data loads
    useEffect(() => {
        if (family?.name) setName(family.name)
    }, [family])

    const handleImageUpload = async (url: string) => {
        if (!family) return

        // Optimistic update
        queryClient.setQueryData(['family', familyId], (old: any) => {
            if (!old) return old
            return { ...old, image_url: url }
        })

        // Update in DB
        const { error } = await supabase
            .from('families')
            .update({ image_url: url })
            .eq('id', family.id)

        if (error) {
            toast.error('שגיאה בעדכון תמונת המשפחה')
        }
    }

    const handleSaveName = async () => {
        if (!family || !name.trim()) return

        setSaving(true)
        const { error } = await supabase
            .from('families')
            .update({ name: name })
            .eq('id', family.id)

        if (error) {
            toast.error('שגיאה בעדכון שם המשפחה')
        } else {
            toast.success('שם המשפחה עודכן בהצלחה! ✨')
            queryClient.invalidateQueries({ queryKey: ['family', familyId] })
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[500px]">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (!family) {
        return <div className="text-center p-8">לא נמצאה משפחה. אנא נסה שנית.</div>
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-black text-gray-900 mb-2 text-center">ניהול משפחה</h1>
            <p className="text-gray-500 text-center mb-10">התאימו את המראה של האפליקציה למשפחה שלכם</p>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-8">

                {/* Family Image Section */}
                <div className="flex flex-col items-center space-y-4">
                    <label className="text-sm font-medium text-gray-700">תמונת המשפחה - לוגו האפליקציה</label>
                    <FamilyAssetsUpload
                        familyId={family.id}
                        url={family.image_url}
                        onUpload={handleImageUpload}
                    />
                    <p className="text-xs text-gray-400 text-center max-w-xs">
                        תמונה זו תופיע בסרגל הצד לכל בני המשפחה. מומלץ להשתמש בתמונה ריבועית.
                    </p>
                </div>

                <div className="border-t border-gray-100 my-8"></div>

                {/* Family Name Section */}
                <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">שם המשפחה - כותרת האפליקציה</label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 p-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-0 transition-all text-right font-bold text-lg"
                            placeholder="שם המשפחה שלכם"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSaveName}
                    disabled={saving || name === family.name}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    שמור שם משפחה
                </button>
            </div>
        </div>
    )
}

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// Validation Schema
const profileSchema = z.object({
    display_name: z.string().min(2, 'שם התצוגה חייב להכיל לפחות 2 תווים'),
    phone: z.string().regex(/^05\d{8}$/, 'מספר טלפון לא תקין').optional().or(z.literal('')),
    date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'תאריך לידה לא תקין',
    }).optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileFormProps {
    initialData: {
        id: string
        display_name?: string
        phone?: string
        date_of_birth?: string
    }
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
    const supabase = createClient()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            display_name: initialData.display_name || '',
            phone: initialData.phone || '',
            date_of_birth: initialData.date_of_birth || '',
        }
    })

    const onSubmit = async (values: ProfileFormValues) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: values.display_name,
                    phone: values.phone || null,
                    date_of_birth: values.date_of_birth || null,
                })
                .eq('id', initialData.id)

            if (error) throw error

            toast.success('הפרופיל עודכן בהצלחה! ✨')
        } catch (error: any) {
            console.error(error)
            toast.error('שגיאה בעדכון הפרופיל', {
                description: error.message
            })
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">שם תצוגה</label>
                <input
                    {...register('display_name')}
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-0 transition-all text-right"
                    placeholder="איך נקרא לך?"
                />
                {errors.display_name && (
                    <p className="text-sm text-red-500">{errors.display_name.message}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">טלפון (אופציונלי)</label>
                    <input
                        {...register('phone')}
                        className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-0 transition-all text-right"
                        placeholder="05X-XXXXXXX"
                        dir="ltr"
                    />
                    {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">תאריך לידה</label>
                    <input
                        type="date"
                        {...register('date_of_birth')}
                        className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-0 transition-all text-right"
                    />
                    {errors.date_of_birth && (
                        <p className="text-sm text-red-500">{errors.date_of_birth.message}</p>
                    )}
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin" />
                        שומר שינויים...
                    </>
                ) : (
                    'שמור שינויים ✨'
                )}
            </button>
        </form>
    )
}

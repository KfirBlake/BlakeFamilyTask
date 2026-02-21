'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, Home } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import Image from 'next/image'

interface FamilyAssetsUploadProps {
    familyId: string
    url: string | null
    onUpload: (url: string) => void
    editable?: boolean
}

export default function FamilyAssetsUpload({ familyId, url, onUpload, editable = true }: FamilyAssetsUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(url)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            const file = event.target.files?.[0]
            if (!file) return

            // Create local preview immediately
            const objectUrl = URL.createObjectURL(file)
            setPreviewUrl(objectUrl)

            const fileExt = file.name.split('.').pop()
            const fileName = `${familyId}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            // Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from('family_avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('family_avatars')
                .getPublicUrl(filePath)

            onUpload(publicUrl)
            toast.success('תמונת המשפחה עודכנה בהצלחה! ✨')

        } catch (error: any) {
            toast.error('שגיאה בהעלאת התמונה', {
                description: error.message
            })
            // Revert preview on error
            setPreviewUrl(url)
        } finally {
            setUploading(false)
        }
    }

    const handleClick = () => {
        if (editable && !uploading) {
            fileInputRef.current?.click()
        }
    }

    return (
        <div className="relative group mx-auto w-32 h-32 md:w-40 md:h-40">
            <div
                onClick={handleClick}
                className={`
          relative w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-xl
          bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center
          ${editable ? 'cursor-pointer hover:border-indigo-100 transition-all duration-300' : ''}
        `}
            >
                {previewUrl ? (
                    <Image
                        src={previewUrl}
                        alt="Family Logo"
                        fill
                        className="object-cover"
                    />
                ) : (
                    <Home className="w-16 h-16 text-indigo-300" />
                )}

                {/* Loading Overlay */}
                {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-10">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                )}

                {/* Hover Overlay for Edit */}
                {editable && !uploading && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all duration-300 z-10">
                        <div className="bg-white/90 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <Camera className="w-5 h-5 text-gray-700" />
                        </div>
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading || !editable}
            />
        </div>
    )
}

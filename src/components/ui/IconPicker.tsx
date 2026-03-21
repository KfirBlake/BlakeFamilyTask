'use client'
import { useState, useRef } from 'react'
import EmojiPicker from 'emoji-picker-react'
import * as LucideIcons from 'lucide-react'
import { Search, Upload, Image as ImageIcon, Smile, Grid, ChevronDown } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import IconRenderer from './IconRenderer'

const POPULAR_LUCIDE_ICONS = Array.from(new Set([
    'Home', 'Star', 'Trophy', 'Heart', 'Book', 'Gamepad', 'CheckCircle', 'Clock', 'Bike', 'Car',
    'Music', 'Video', 'Camera', 'Gift', 'ShoppingBag', 'Briefcase', 'Moon', 'Sun', 'Cloud', 'Umbrella',
    'Coffee', 'Utensils', 'Pizza', 'Apple', 'Dog', 'Cat', 'Fish', 'Bird', 'Bug', 'Flower',
    'TreePine', 'Flame', 'Droplet', 'Zap', 'Map', 'Compass', 'Navigation', 'Airplane', 'Bus', 'Train',
    'Rocket', 'Shield', 'Sword', 'Key', 'Lock', 'Unlock', 'Bell', 'Volume2', 'Mic', 'Headphones',
    'Smile', 'Frown', 'Meh', 'ThumbsUp', 'ThumbsDown', 'Hand', 'Eye', 'Glasses', 'Shirt', 'Crown',
    'Ghost', 'Trash', 'Wrench', 'Hammer', 'Scissors', 'Pen', 'BookOpen', 'GraduationCap', 'Palette', 'Brush',
    'Dumbbell', 'Medal', 'Target', 'Tent', 'Trees', 'Mountain', 'Waves', 'Wind', 'Snowflake', 'Thermometer',
    'Wand', 'Sparkles', 'Battery', 'Bed', 'Bath', 'Lightbulb', 'List', 'Check', 'X',
    'CreditCard', 'Coins', 'Banknote', 'Wand2', 'WashingMachine', 'Cookie'
]))

export default function IconPicker({ selectedIcon, onSelectIcon }: { selectedIcon: string, onSelectIcon: (icon: string) => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const [tab, setTab] = useState<'emoji' | 'lucide' | 'upload'>('emoji')
    const [searchTerm, setSearchTerm] = useState('')
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const filteredLucide = POPULAR_LUCIDE_ICONS.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
        const filePath = `icons/${fileName}`

        const { error } = await supabase.storage.from('task-icons').upload(filePath, file)

        if (error) {
            alert('שגיאה בהעלאה: ' + error.message)
            setUploading(false)
            return
        }

        const { data: { publicUrl } } = supabase.storage.from('task-icons').getPublicUrl(filePath)

        onSelectIcon(publicUrl)
        setUploading(false)
        setIsOpen(false)
    }

    return (
        <div className="w-full max-w-sm mx-auto space-y-2">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                dir="rtl"
            >
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-2xl shadow-sm border border-indigo-100 overflow-hidden flex-shrink-0">
                    <IconRenderer iconKey={selectedIcon} className="w-full h-full object-cover flex items-center justify-center" size={24} />
                </div>
                <span className="font-bold text-gray-700 flex-1 text-right">בחר אייקון או תמונה</span>
                <ChevronDown className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} size={20} />
            </button>

            {isOpen && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex border-b border-gray-100 bg-gray-50">
                        <button type="button" onClick={() => setTab('emoji')} className={`flex-1 py-2 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${tab === 'emoji' ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                            <Smile size={16} /> אימוג'י
                        </button>
                        <button type="button" onClick={() => setTab('lucide')} className={`flex-1 py-2 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${tab === 'lucide' ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                            <Grid size={16} /> אייקונים
                        </button>
                        <button type="button" onClick={() => setTab('upload')} className={`flex-1 py-2 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${tab === 'upload' ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                            <Upload size={16} /> העלאה
                        </button>
                    </div>

                    <div className="bg-white min-h-[350px] max-h-[350px] overflow-y-auto w-full flex justify-center p-2" dir="ltr">
                        {tab === 'emoji' && (
                            <div className="w-full h-full flex items-start justify-center pt-2">
                                <EmojiPicker
                                    onEmojiClick={(emojiData) => {
                                        onSelectIcon(emojiData.emoji)
                                        setIsOpen(false)
                                    }}
                                    width={320}
                                    height={330}
                                    previewConfig={{ showPreview: false }}
                                />
                            </div>
                        )}

                        {tab === 'lucide' && (
                            <div className="w-full pt-1 px-1" dir="rtl">
                                <div className="relative mb-3 sticky top-0 bg-white z-10 pb-1">
                                    <input
                                        type="text"
                                        placeholder="חפש אייקון..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                </div>
                                <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5" dir="ltr">
                                    {filteredLucide.map(iconName => {
                                        const IconComp = (LucideIcons as any)[iconName]
                                        if (!IconComp) return null;
                                        const iconKeyStr = `lucide:${iconName}`
                                        const isSelected = selectedIcon === iconKeyStr

                                        return (
                                            <button
                                                key={iconName}
                                                type="button"
                                                onClick={() => {
                                                    onSelectIcon(iconKeyStr)
                                                    setIsOpen(false)
                                                }}
                                                className={`flex items-center justify-center p-2 rounded-lg transition-all ${isSelected ? 'bg-indigo-600 text-white scale-110 shadow-md ring-2 ring-indigo-200 ring-offset-1 z-10' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105'}`}
                                                title={iconName}
                                            >
                                                <IconComp size={20} className="flex-shrink-0" />
                                            </button>
                                        )
                                    })}
                                    {filteredLucide.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-sm text-gray-500" dir="rtl">לא נמצאו אייקונים</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {tab === 'upload' && (
                            <div className="w-full flex flex-col items-center justify-center h-full min-h-[300px]" dir="rtl">
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 w-full max-w-[90%] mx-auto flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {uploading ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                            <span className="text-sm font-bold text-gray-600">מעלה תמונה, אנא המתן...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mb-4 text-indigo-500 shadow-inner">
                                                <ImageIcon size={32} />
                                            </div>
                                            <h4 className="font-bold text-gray-800 mb-1">העלה תמונה משלך</h4>
                                            <p className="text-xs text-gray-500 mb-6">JPG, PNG או GIF (מומלץ ריבוע)</p>
                                            <button type="button" className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">בחר קובץ</button>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleUpload}
                                    disabled={uploading}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

'use client'

import { useEffect, useState, memo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Amatic_SC } from 'next/font/google'
import Image from 'next/image'

const amatic = Amatic_SC({ subsets: ['hebrew', 'latin'], weight: ['700'] })

const FamilyMessageNode = memo(function FamilyMessageNode() {
    const [message, setMessage] = useState('')
    const [isVisible, setIsVisible] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        let channel: any;

        const fetchMessage = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('family_id')
                    .eq('id', user.id)
                    .single()

                if (profile?.family_id) {
                    // Initial fetch
                    const { data: messageData } = await supabase
                        .from('family_messages')
                        .select('message')
                        .eq('family_id', profile.family_id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle()

                    if (messageData && messageData.message.trim() !== '') {
                        setMessage(messageData.message)
                        setIsVisible(true)
                    } else {
                        setIsVisible(false)
                    }

                    // Realtime subscription
                    channel = supabase
                        .channel('public:family_messages')
                        .on(
                            'postgres_changes',
                            {
                                event: 'INSERT',
                                schema: 'public',
                                table: 'family_messages',
                                filter: `family_id=eq.${profile.family_id}`
                            },
                            (payload) => {
                                const newMessage = payload.new.message;
                                if (newMessage.trim() === '') {
                                    setIsVisible(false);
                                    setTimeout(() => setMessage(''), 300); // Wait for fade out
                                } else {
                                    setMessage(newMessage);
                                    setIsVisible(true);
                                }
                            }
                        )
                        .subscribe()
                }
            }
        }

        fetchMessage()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [])

    if (!isVisible && !message) return null

    return (
        <div className={`mt-4 mx-4 transition-all duration-500 ease-in-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="relative w-full aspect-square shadow-lg rounded-xl overflow-hidden self-center bg-gray-100">
                {/* Background Image Preloader / Cached layer */}
                <Image
                    src="/assets/images/Corkboard.jpg"
                    alt="Corkboard Background"
                    fill
                    priority
                    className="object-cover object-center pointer-events-none"
                    sizes="(max-width: 768px) 100vw, 300px"
                />

                {/* Text Overlay centered exactly over the sticky note area */}
                {/* Positioning percentages depend heavily on the image layout, these are typical center bounds */}
                <div className="absolute top-[20%] left-[15%] w-[70%] h-[60%] flex items-center justify-center p-2 transform hover:scale-105 transition-transform duration-300 z-10">
                    <p
                        className={`${amatic.className} text-slate-900 text-center text-1xl leading-[1.1] whitespace-pre-wrap break-words w-full max-h-full overflow-hidden drop-shadow-sm`}
                        dir="rtl"
                    >
                        {message}
                    </p>
                </div>
            </div>
        </div>
    )
})

export default FamilyMessageNode

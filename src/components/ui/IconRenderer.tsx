import * as LucideIcons from 'lucide-react'

type Props = {
    iconKey: string | null | undefined
    className?: string
    size?: number
}

export default function IconRenderer({ iconKey, className = '', size }: Props) {
    if (!iconKey) return <span className={className} style={size ? { fontSize: size } : undefined}>📝</span>

    if (iconKey.startsWith('http') || iconKey.startsWith('/')) {
        return (
            <img
                src={iconKey}
                alt="icon"
                className={`object-cover rounded-md flex-shrink-0 ${className}`}
                style={size ? { width: size, height: size } : undefined}
            />
        )
    }

    if (iconKey.startsWith('lucide:')) {
        const iconName = iconKey.split(':')[1]
        const IconComponent = (LucideIcons as any)[iconName]
        if (IconComponent) {
            return <IconComponent className={`flex-shrink-0 ${className}`} size={size} />
        }
    }

    return <span className={className} style={size ? { fontSize: size } : undefined}>{iconKey}</span>
}

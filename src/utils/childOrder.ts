export interface ProfileWithAge {
    id?: string
    full_name?: string
    date_of_birth?: string | null
    created_at?: string | null
    [key: string]: any
}

/**
 * Sorts profiles / children by age descending (oldest first).
 * Oldest child has the earliest date_of_birth (lowest timestamp).
 * Profiles without a valid date_of_birth fall back to created_at (ascending),
 * or are placed after those with known birth dates.
 */
export function sortChildrenByAge<T extends ProfileWithAge>(children: T[]): T[] {
    return [...children].sort((a, b) => {
        const timeA = a.date_of_birth ? new Date(a.date_of_birth).getTime() : null
        const timeB = b.date_of_birth ? new Date(b.date_of_birth).getTime() : null

        const validA = timeA !== null && !isNaN(timeA)
        const validB = timeB !== null && !isNaN(timeB)

        if (validA && validB) {
            if (timeA !== timeB) {
                return (timeA as number) - (timeB as number)
            }
        } else if (validA && !validB) {
            return -1
        } else if (!validA && validB) {
            return 1
        }

        // Fallback: created_at ascending (first created usually first/older child)
        const createdA = a.created_at ? new Date(a.created_at).getTime() : null
        const createdB = b.created_at ? new Date(b.created_at).getTime() : null
        const validCreatedA = createdA !== null && !isNaN(createdA)
        const validCreatedB = createdB !== null && !isNaN(createdB)

        if (validCreatedA && validCreatedB) {
            if (createdA !== createdB) {
                return (createdA as number) - (createdB as number)
            }
        } else if (validCreatedA && !validCreatedB) {
            return -1
        } else if (!validCreatedA && validCreatedB) {
            return 1
        }

        // Final stable fallback: name
        return (a.full_name || '').localeCompare(b.full_name || '')
    })
}


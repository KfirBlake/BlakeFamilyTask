'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // Data remains fresh for 1 minute before refetching in background
                refetchOnWindowFocus: false, // Prevents spamming Supabase if user switches tabs rapidly
                retry: 1, // Retry only once on failure
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* The devtools are only included in development environment */}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}

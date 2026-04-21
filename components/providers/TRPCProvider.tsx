'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink, loggerLink } from '@trpc/client'
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server'
import { useState } from 'react'
import superjson from 'superjson'
import React from 'react'

import { trpc } from '@/utils/trpc'
import { AppRouter } from '@/server'

// Error Boundary component to catch any remaining errors
class TRPCErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    // Only catch tRPC errors, let others bubble up
    if (error.message?.includes('TRPCClientError')) {
      return { hasError: true }
    }
    return { hasError: false }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log tRPC errors, let others bubble up
    if (error.message?.includes('TRPCClientError')) {
      console.error('tRPC Error Boundary caught:', error, errorInfo)
    } else {
      // Re-throw non-tRPC errors
      throw error
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 text-center">
          <p>Something went wrong. Please refresh the page and try again.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        // Prevent errors from bubbling up
        retry: false,
        // Don't throw errors to prevent Next.js error overlays
        throwOnError: false,
      },
      mutations: {
        // Prevent mutation errors from throwing
        throwOnError: false,
        // Don't retry failed mutations
        retry: false,
      },
    },
  })

let clientQueryClientSingleton: QueryClient | undefined = undefined
const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient()
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= createQueryClient())
}

// Export the trpc object for use in components
export const api = trpc

// Export types for use in other components
export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser: use current origin
    return window.location.origin
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export function TRPCProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  // Add global error handler to prevent Next.js error overlays
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Prevent default error handling for tRPC errors
      if (event.error?.message?.includes('TRPCClientError')) {
        event.preventDefault()
        return false
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent unhandled promise rejections from tRPC
      if (event.reason?.message?.includes('TRPCClientError')) {
        event.preventDefault()
        return false
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (op) => {
            // Disable logging in development to reduce console noise
            // Set to true if you need to debug tRPC queries
            return false
            
            // Original code (uncomment to enable logging):
            // Only log in development
            // if (process.env.NODE_ENV !== 'development') return false
            // 
            // // Log all operations in development, but filter out common auth errors
            // if (op.direction === 'down' && op.result instanceof Error) {
            //   const errorMessage = op.result.message || ''
            //   // Don't log common auth errors to reduce console noise
            //   if (errorMessage.includes('Invalid login credentials') || 
            //       errorMessage.includes('Invalid email or password') ||
            //       errorMessage.includes('User not found')) {
            //     return false
            //   }
            // }
            // 
            // return true
          },
        }),
        httpBatchLink({
          transformer: superjson,
          url: getBaseUrl() + '/api/trpc',
          headers() {
            const headers = new Map<string, string>()
            headers.set('x-trpc-source', 'nextjs-react')
            
            // Include cookies for authentication
            if (typeof window !== 'undefined') {
              // Get all cookies and include them
              const allCookies = document.cookie
              if (allCookies) {
                headers.set('cookie', allCookies)
              }
              
              // Also include any Supabase-specific auth headers if available
              const supabaseAuthToken = localStorage.getItem('sb-auth-token')
              if (supabaseAuthToken) {
                try {
                  const parsed = JSON.parse(supabaseAuthToken)
                  if (parsed.access_token) {
                    headers.set('authorization', `Bearer ${parsed.access_token}`)
                  }
                } catch {
                  // Ignore parsing errors
                }
              }
            }
            
            return Object.fromEntries(headers)
          },
          // Add error handling to prevent unhandled errors
          fetch: (url, options) => {
            return fetch(url, options).catch((error) => {
              // Prevent fetch errors from bubbling up
              console.error('tRPC fetch error:', error)
              throw new Error('Network error occurred. Please try again.')
            })
          },
        }),
      ],
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <TRPCErrorBoundary>
          {props.children}
        </TRPCErrorBoundary>
      </trpc.Provider>
    </QueryClientProvider>
  )
}
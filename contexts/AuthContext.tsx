'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { UserRole } from '@/server/database/interfaces'

export interface ExtendedUser extends SupabaseUser {
  user_role?: UserRole
  first_name?: string
  last_name?: string
  full_name?: string
  profile_photo?: string
}

interface AuthContextType {
  user: ExtendedUser | null
  userRole: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ user: ExtendedUser | null; userRole: UserRole | null; error: string | null }>
  signOut: () => Promise<void>
  fetchUserProfile: () => Promise<void>
  createUserProfile: (userId: string, role: UserRole, profileData: Record<string, unknown>) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUserProfile = async (userId?: string) => {
    const targetUserId = userId || user?.id
    if (!targetUserId) return

    try {
              const { data, error } = await supabase
          .from('users')
          .select('user_role, first_name, last_name, full_name, profile_photo')
          .eq('id', targetUserId)
          .single()

      if (error) {
        console.error('Error fetching user profile:', {
          error: error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return
      }

      if (data) {
        setUserRole(data.user_role)
        setUser(prev => prev ? { ...prev, user_role: data.user_role, first_name: data.first_name, last_name: data.last_name, full_name: data.full_name, profile_photo: data.profile_photo } : null)
      }
    } catch (error) {
      console.error('Error fetching user profile:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  useEffect(() => {
    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Fetch user profile data including role
        const { data, error } = await supabase
          .from('users')
          .select('user_role, first_name, last_name, full_name, profile_photo')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error fetching user profile during initial session:', {
            error: error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          // Set user with basic data if profile fetch fails
          const initialUser: ExtendedUser = { ...session.user, user_role: undefined, first_name: undefined, last_name: undefined, full_name: undefined, profile_photo: undefined }
          setUser(initialUser)
        } else if (data) {
          setUserRole(data.user_role)
          // Set user with complete profile data immediately
          const completeUser: ExtendedUser = { ...session.user, user_role: data.user_role, first_name: data.first_name, last_name: data.last_name, full_name: data.full_name, profile_photo: data.profile_photo }
          setUser(completeUser)
        } else {
          // Set user with basic data if no profile found
          const initialUser: ExtendedUser = { ...session.user, user_role: undefined, first_name: undefined, last_name: undefined, full_name: undefined, profile_photo: undefined }
          setUser(initialUser)
        }
      }
      setLoading(false)
    })

    return () => clearTimeout(timeout)

         // Listen for auth changes
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       async (event, session) => {
         if (session?.user) {
           // Fetch user profile data first, then set the complete user object
           const { data, error } = await supabase
             .from('users')
             .select('user_role, first_name, last_name, full_name, profile_photo')
             .eq('id', session.user.id)
             .single()

           if (error) {
             console.error('Error fetching user profile during auth state change:', error)
             // Set user with basic data if profile fetch fails
             const initialUser: ExtendedUser = { ...session.user, user_role: undefined, first_name: undefined, last_name: undefined, full_name: undefined, profile_photo: undefined }
             setUser(initialUser)
           } else if (data) {
             // Set user with complete profile data
             const completeUser: ExtendedUser = { 
               ...session.user, 
               user_role: data.user_role, 
               first_name: data.first_name, 
               last_name: data.last_name, 
               full_name: data.full_name, 
               profile_photo: data.profile_photo 
             }
             setUser(completeUser)
             setUserRole(data.user_role)
           }
         } else {
           setUser(null)
           setUserRole(null)
         }
         setLoading(false)
       }
     )

     return () => {
       subscription.unsubscribe()
     }
   }, [supabase, loading])

  const signOut = async () => {
    setUser(null)
    setUserRole(null)
    await supabase.auth.signOut()
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { user: null, userRole: null, error: error.message }
      }

      if (data.user) {
        // Fetch user profile data including role
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('user_role, first_name, last_name, full_name, profile_photo')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.log('Error fetching user profile during sign-in:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          })
          
          // Check if it's a "no rows returned" error (profile doesn't exist)
          if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows')) {
            return { user: null, userRole: null, error: 'Profile does not exist. Please contact support.' }
          }
          
          return { user: null, userRole: null, error: 'Failed to fetch user profile' }
        } else if (profileData) {
          setUserRole(profileData.user_role)
          const extendedUser = { ...data.user, user_role: profileData.user_role, first_name: profileData.first_name, last_name: profileData.last_name, full_name: profileData.full_name, profile_photo: profileData.profile_photo }
          setUser(extendedUser)
          return { user: extendedUser, userRole: profileData.user_role, error: null }
        }

        // Set user with basic data if no profile found
        const initialUser: ExtendedUser = { ...data.user, user_role: undefined, first_name: undefined, last_name: undefined, full_name: undefined, profile_photo: undefined }
        setUser(initialUser)
        return { user: initialUser, userRole: null, error: null }
      }

      return { user: null, userRole: null, error: 'Sign-in failed' }
    } catch (error) {
      console.error('AuthContext: Sign-in error:', error)
      return { user: null, userRole: null, error: 'An unexpected error occurred' }
    }
  }

  const createUserProfile = async (userId: string, role: UserRole, profileData: Record<string, unknown>) => {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          user_role: role,
          ...profileData,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error creating user profile:', error)
        return { error: error.message }
      }

      // Refresh user profile after creation
      await fetchUserProfile()
      return { error: null }
    } catch (error) {
      console.error('Unexpected error creating user profile:', error)
      return { error: 'An unexpected error occurred' }
    }
  }
  
  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      loading,
      signIn,
      signOut,
      fetchUserProfile,
      createUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
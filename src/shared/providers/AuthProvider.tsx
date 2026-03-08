'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth, isFirebaseAvailable } from '@/shared/firebase/config'
import { signInWithGoogle, signInWithMicrosoft, signOut } from '@/shared/firebase/auth'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isFirebaseAvailable: boolean
  signInWithGoogle: () => Promise<void>
  signInWithMicrosoft: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isFirebaseAvailable: false,
  signInWithGoogle: async () => {},
  signInWithMicrosoft: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Start false to match SSR, then update after hydration to avoid mismatch
  const [firebaseReady, setFirebaseReady] = useState(false)

  useEffect(() => {
    setFirebaseReady(isFirebaseAvailable)
    if (!auth) {
      setIsLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setIsLoading(false)
    })
    return unsubscribe
  }, [])

  const handleSignInGoogle = useCallback(async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Google sign-in failed:', err)
    }
  }, [])

  const handleSignInMicrosoft = useCallback(async () => {
    try {
      await signInWithMicrosoft()
    } catch (err) {
      console.error('Microsoft sign-in failed:', err)
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Sign-out failed:', err)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isFirebaseAvailable: firebaseReady,
        signInWithGoogle: handleSignInGoogle,
        signInWithMicrosoft: handleSignInMicrosoft,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

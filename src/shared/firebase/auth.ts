// Firebase Authentication helpers — Google and Microsoft OAuth via popup.

import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from './config'

export async function signInWithGoogle(): Promise<User> {
  if (!auth) throw new Error('Firebase not available')
  const provider = new GoogleAuthProvider()
  provider.addScope('openid')
  provider.addScope('profile')
  provider.addScope('email')
  const result = await signInWithPopup(auth, provider)
  return result.user
}

export async function signInWithMicrosoft(): Promise<User> {
  if (!auth) throw new Error('Firebase not available')
  const provider = new OAuthProvider('microsoft.com')
  const result = await signInWithPopup(auth, provider)
  return result.user
}

export async function signOut(): Promise<void> {
  if (!auth) return
  await firebaseSignOut(auth)
}

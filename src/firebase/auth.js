import { auth, firebaseConfig } from './config'
import { initializeApp, getApps } from 'firebase/app'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const registerWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password)

export const logout = () => signOut(auth)

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback)

// Creates a user in Firebase Auth without displacing the current admin session.
// Uses a secondary app instance so the primary auth state is untouched.
export async function createAuthUser(email, password) {
  const secondaryApp =
    getApps().find((a) => a.name === 'secondary') ??
    initializeApp(firebaseConfig, 'secondary')
  const secondaryAuth = getAuth(secondaryApp)
  const result = await createUserWithEmailAndPassword(secondaryAuth, email, password)
  const uid = result.user.uid
  await signOut(secondaryAuth)
  return uid
}

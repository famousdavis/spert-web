// Firestore CRUD operations for SPERT Forecaster data.
// All writes use merge:true to preserve owner/members fields.
// Saves are debounced at 500ms with beforeunload flush.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import { COLLECTIONS, type FirestoreProjectDoc, type FirestoreSettingsDoc, type FirestoreProfileDoc } from './types'
import { sanitizeForFirestore, stripFirestoreFields } from './firestore-sanitize'

// --- Debounce infrastructure ---

const pendingSaveTimers = new Map<string, ReturnType<typeof setTimeout>>()
const pendingSaveFns = new Map<string, () => Promise<void>>()

function debouncedSave(key: string, saveFn: () => Promise<void>, delayMs = 500): void {
  const existingTimer = pendingSaveTimers.get(key)
  if (existingTimer) clearTimeout(existingTimer)

  pendingSaveFns.set(key, saveFn)
  pendingSaveTimers.set(
    key,
    setTimeout(async () => {
      pendingSaveTimers.delete(key)
      pendingSaveFns.delete(key)
      try {
        await saveFn()
      } catch (err) {
        console.error(`Firestore save failed for ${key}:`, err)
      }
    }, delayMs)
  )
}

/** Flush all pending debounced writes immediately (call on beforeunload). */
export function flushPendingSaves(): void {
  for (const [key, timer] of pendingSaveTimers) {
    clearTimeout(timer)
    pendingSaveTimers.delete(key)
  }
  for (const [key, saveFn] of pendingSaveFns) {
    pendingSaveFns.delete(key)
    saveFn().catch((err) => console.error(`Flush save failed for ${key}:`, err))
  }
}

// --- Project operations ---

/** Load all projects where the user is owner or member. */
export async function loadProjects(uid: string): Promise<Map<string, FirestoreProjectDoc>> {
  if (!db) throw new Error('Firestore not available')

  const result = new Map<string, FirestoreProjectDoc>()

  // Query owned projects
  const ownedQ = query(
    collection(db, COLLECTIONS.projects),
    where('owner', '==', uid)
  )
  const ownedSnap = await getDocs(ownedQ)
  for (const docSnap of ownedSnap.docs) {
    result.set(docSnap.id, docSnap.data() as FirestoreProjectDoc)
  }

  // Query shared projects (member)
  const memberRoles = ['editor', 'viewer']
  for (const role of memberRoles) {
    const memberQ = query(
      collection(db, COLLECTIONS.projects),
      where(`members.${uid}`, '==', role)
    )
    const memberSnap = await getDocs(memberQ)
    for (const docSnap of memberSnap.docs) {
      if (!result.has(docSnap.id)) {
        result.set(docSnap.id, docSnap.data() as FirestoreProjectDoc)
      }
    }
  }

  return result
}

/** Save a project document (debounced). Uses merge:true to preserve owner/members. */
export function saveProject(projectId: string, data: FirestoreProjectDoc): void {
  debouncedSave(`project:${projectId}`, async () => {
    if (!db) return
    const ref = doc(db, COLLECTIONS.projects, projectId)
    const { owner: _o, members: _m, ...dataWithoutOwnership } = data
    await setDoc(ref, sanitizeForFirestore(dataWithoutOwnership), { merge: true })
  })
}

/** Save a project document immediately (no debounce). For creation and migration. */
export async function saveProjectImmediate(projectId: string, data: FirestoreProjectDoc): Promise<void> {
  if (!db) return
  const ref = doc(db, COLLECTIONS.projects, projectId)
  await setDoc(ref, sanitizeForFirestore(data))
}

/** Delete a project document. */
export async function deleteProject(projectId: string): Promise<void> {
  if (!db) return
  const ref = doc(db, COLLECTIONS.projects, projectId)
  await deleteDoc(ref)
}

/** Subscribe to real-time updates for all projects where user is owner or member. */
export function subscribeToOwnedProjects(
  uid: string,
  callback: (projects: Map<string, FirestoreProjectDoc>) => void
): Unsubscribe {
  if (!db) return () => {}

  const q = query(
    collection(db, COLLECTIONS.projects),
    where('owner', '==', uid)
  )

  return onSnapshot(q, (snapshot) => {
    // Skip local echoes
    if (snapshot.metadata.hasPendingWrites) return

    const projects = new Map<string, FirestoreProjectDoc>()
    for (const docSnap of snapshot.docs) {
      projects.set(docSnap.id, docSnap.data() as FirestoreProjectDoc)
    }
    callback(projects)
  })
}

/** Check if a project document exists. */
export async function projectExists(projectId: string): Promise<boolean> {
  if (!db) return false
  const ref = doc(db, COLLECTIONS.projects, projectId)
  const snap = await getDoc(ref)
  return snap.exists()
}

// --- Settings operations ---

/** Load user settings from Firestore. */
export async function loadSettings(uid: string): Promise<FirestoreSettingsDoc | null> {
  if (!db) return null
  const ref = doc(db, COLLECTIONS.settings, uid)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as FirestoreSettingsDoc) : null
}

/** Save user settings (debounced). */
export function saveSettings(uid: string, data: FirestoreSettingsDoc): void {
  debouncedSave('settings', async () => {
    if (!db) return
    const ref = doc(db, COLLECTIONS.settings, uid)
    await setDoc(ref, sanitizeForFirestore(data), { merge: true })
  })
}

/** Save user settings immediately (no debounce). */
export async function saveSettingsImmediate(uid: string, data: FirestoreSettingsDoc): Promise<void> {
  if (!db) return
  const ref = doc(db, COLLECTIONS.settings, uid)
  await setDoc(ref, sanitizeForFirestore(data), { merge: true })
}

// --- Profile operations ---

/** Upsert user profile (called on sign-in). */
export async function upsertProfile(uid: string, data: FirestoreProfileDoc): Promise<void> {
  if (!db) return
  const ref = doc(db, COLLECTIONS.profiles, uid)
  await setDoc(ref, sanitizeForFirestore(data), { merge: true })
}

export { stripFirestoreFields }

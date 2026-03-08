// Firestore rejects `undefined` values — must be omitted entirely.
// These helpers sanitize data before writing and strip ownership fields after reading.

/** Recursively remove undefined values from an object (Firestore rejects undefined). */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore) as T
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value)
      }
    }
    return result as T
  }
  return obj
}

/** Strip Firestore ownership fields (owner, members, schemaVersion) from loaded data. */
export function stripFirestoreFields<T extends Record<string, unknown>>(
  data: T
): Omit<T, 'owner' | 'members' | 'schemaVersion'> {
  const { owner: _, members: __, schemaVersion: ___, ...rest } = data
  return rest as Omit<T, 'owner' | 'members' | 'schemaVersion'>
}

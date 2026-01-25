import { useState, useEffect } from 'react'

/**
 * Returns true only after hydration on the client
 * Useful for avoiding hydration mismatches with localStorage data
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

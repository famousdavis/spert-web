import Link from 'next/link'
import { APP_VERSION } from '@/shared/constants'

export function Footer() {
  return (
    <footer className="mt-16 pt-8 border-t-2 border-gray-100 text-center text-gray-500 text-sm pb-6">
      © 2026 William W. Davis, MSPM, PMP |{' '}
      <Link
        href="/changelog"
        className="text-blue-500 hover:text-blue-600 transition-colors"
      >
        Version {APP_VERSION}
      </Link>
      {' '}| Licensed under GNU GPL v3
    </footer>
  )
}

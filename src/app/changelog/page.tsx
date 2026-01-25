import Link from 'next/link'
import { ChangelogContent } from '@/features/changelog'

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="px-6 py-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to SPERT
          </Link>
        </div>
      </header>
      <main className="p-6">
        <ChangelogContent />
      </main>
    </div>
  )
}

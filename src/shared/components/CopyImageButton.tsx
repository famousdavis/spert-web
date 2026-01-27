'use client'

import { useState, useCallback, type RefObject } from 'react'
import { copyElementAsImage } from '@/shared/lib/copy-image'

type CopyStatus = 'idle' | 'copying' | 'success' | 'error'

interface CopyImageButtonProps {
  targetRef: RefObject<HTMLElement | null>
  title?: string
}

export function CopyImageButton({ targetRef, title = 'Copy as image' }: CopyImageButtonProps) {
  const [status, setStatus] = useState<CopyStatus>('idle')

  const handleCopy = useCallback(async () => {
    if (!targetRef.current) {
      console.error('Copy failed: targetRef.current is null')
      return
    }

    setStatus('copying')
    try {
      await copyElementAsImage(targetRef.current)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }, [targetRef])

  return (
    <button
      className="copy-image-button"
      onClick={handleCopy}
      disabled={status === 'copying'}
      title={title}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: status === 'copying' ? 'wait' : 'pointer',
        padding: '0.25rem',
        opacity: status === 'idle' ? 0.5 : 1,
        transition: 'opacity 0.2s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (status === 'idle') e.currentTarget.style.opacity = '1'
      }}
      onMouseLeave={(e) => {
        if (status === 'idle') e.currentTarget.style.opacity = '0.5'
      }}
    >
      {status === 'copying' && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: 'spin 1s linear infinite' }}
        >
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      )}
      {status === 'success' && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {status === 'error' && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
      {status === 'idle' && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

import { describe, it, expect } from 'vitest'
import { normalizeDisplayName, firstNameFromDisplayName } from './display-name'

describe('normalizeDisplayName', () => {
  it('returns empty string for null/undefined/empty input', () => {
    expect(normalizeDisplayName(null)).toBe('')
    expect(normalizeDisplayName(undefined)).toBe('')
    expect(normalizeDisplayName('')).toBe('')
    expect(normalizeDisplayName('   ')).toBe('')
  })

  it('reorders "Last, First MI" to "First MI Last"', () => {
    expect(normalizeDisplayName('Davis, William W.')).toBe('William W. Davis')
  })

  it('reorders "Last, First" to "First Last"', () => {
    expect(normalizeDisplayName('Smith, Jane')).toBe('Jane Smith')
  })

  it('leaves already-natural names alone', () => {
    expect(normalizeDisplayName('Jane Smith')).toBe('Jane Smith')
    expect(normalizeDisplayName('William W. Davis')).toBe('William W. Davis')
  })

  it('handles single-name values', () => {
    expect(normalizeDisplayName('Cher')).toBe('Cher')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeDisplayName('  Davis, William  ')).toBe('William Davis')
  })

  it('tolerates missing space after comma', () => {
    expect(normalizeDisplayName('Davis,William')).toBe('William Davis')
  })
})

describe('firstNameFromDisplayName', () => {
  it('extracts first word from "Last, First MI" after normalization', () => {
    expect(firstNameFromDisplayName('Davis, William W.')).toBe('William')
  })

  it('extracts first word from natural-order name', () => {
    expect(firstNameFromDisplayName('Jane Smith')).toBe('Jane')
  })

  it('returns fallback when empty', () => {
    expect(firstNameFromDisplayName('', 'you@example.com')).toBe('you@example.com')
    expect(firstNameFromDisplayName(null, 'fallback')).toBe('fallback')
  })
})

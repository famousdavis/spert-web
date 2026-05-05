// Copyright (C) 2026 William W. Davis, MSPM, PMP. All rights reserved.
// Licensed under the GNU General Public License v3.0.
// See LICENSE file in the project root for full license text.

import { describe, it, expect } from 'vitest'
import { denormalizeLastFirst } from './auth-name'

describe('denormalizeLastFirst', () => {
  it('reorders "Last, First Middle" to "First Middle Last"', () => {
    expect(denormalizeLastFirst('Davis, William W')).toBe('William W Davis')
  })

  it('reorders "Last, First" to "First Last"', () => {
    expect(denormalizeLastFirst('Smith, Jane')).toBe('Jane Smith')
  })

  it('preserves a name that is already in natural order', () => {
    expect(denormalizeLastFirst('William W Davis')).toBe('William W Davis')
  })

  it('passes through single-word names', () => {
    expect(denormalizeLastFirst('Cher')).toBe('Cher')
  })

  it('handles multi-comma input by treating the first part as the last name', () => {
    expect(denormalizeLastFirst('a, b, c')).toBe('b c a')
  })

  it('returns empty string for empty input', () => {
    expect(denormalizeLastFirst('')).toBe('')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(denormalizeLastFirst('  ')).toBe('')
  })

  it('trims whitespace around comma-separated parts', () => {
    expect(denormalizeLastFirst('  Davis ,  William  ')).toBe('William Davis')
  })

  it('tolerates missing space after comma', () => {
    expect(denormalizeLastFirst('Davis,William')).toBe('William Davis')
  })
})

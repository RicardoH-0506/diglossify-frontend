import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'

// Mockear fetch globalmente
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

afterEach(() => {
  vi.clearAllMocks()
})

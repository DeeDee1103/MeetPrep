import '@testing-library/jest-dom'

// Silence console.warn/error in tests unless explicitly needed
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

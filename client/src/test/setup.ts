import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
    cleanup()
})

// Mock IntersectionObserver
const IntersectionObserverMock = vi.fn(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    takeRecords: vi.fn(),
    unobserve: vi.fn(),
}));

vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

// Mock window.ethereum
vi.stubGlobal("window", {
    ...window,
    ethereum: {
        request: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn(),
    },
    scrollTo: vi.fn(),
});

import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'

const clientRoot = import.meta.dirname;
const projectRoot = path.resolve(clientRoot, '..');

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(clientRoot, "src"),
            "@shared": path.resolve(projectRoot, "shared"),
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: [path.resolve(clientRoot, 'src/test/setup.ts')],
        include: ['src/**/*.test.{ts,tsx}'],
        globals: true,
        root: clientRoot,
    },
})

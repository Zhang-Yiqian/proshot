import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'app/(auth)/**/*.tsx',
    'components/common/auth-dialog.tsx',
    'app/api/auth/**/*.ts',
    'app/api/credits/**/*.ts',
    'lib/db/profiles.ts',
    'hooks/use-credits.ts',
    'hooks/use-user.ts',
    'config/site.ts',
  ],
}

export default createJestConfig(config)

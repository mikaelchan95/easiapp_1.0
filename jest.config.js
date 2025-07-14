module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@expo|expo-|@unimodules|unimodules|@react-navigation|react-navigation|@sentry/react-native|@react-native-community|react-native-safe-area-context|react-native-svg|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-maps)/)',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/app/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/index.ts',
    '!app/**/*.stories.{ts,tsx}',
    '!app/**/*.test.{ts,tsx}',
    '!app/data/**',
    '!app/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '<rootDir>/app/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/app/**/*.{test,spec}.{ts,tsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 30000,
};
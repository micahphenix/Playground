// Pure-logic unit tests only. UI flows that need the React Native renderer or
// native modules are covered by the manual QA checklist (tracked in Notion),
// not here. ts-jest compiles the handful of dependency-free modules under test
// directly, so we avoid the jest-expo / Metro toolchain.
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // The app tsconfig extends expo's base (jsx: react-native). For these
        // node-only tests we don't need JSX, so a minimal override keeps
        // ts-jest from pulling in RN type expectations.
        tsconfig: {
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          types: ['jest', 'node'],
        },
      },
    ],
  },
};

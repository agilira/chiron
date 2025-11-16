module.exports = {
  testEnvironment: 'node',
  coverageProvider: 'v8',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'builder/**/*.js',
    '!builder/js-components/**',
    '!**/node_modules/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  verbose: true,
  // Transform ESM modules (marked v16+) to CommonJS for Jest
  transform: {
    '^.+\\.js$': '<rootDir>/jest.transform.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(marked)/)'
  ]
};

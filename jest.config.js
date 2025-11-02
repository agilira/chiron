module.exports = {
  testEnvironment: 'node',
  cache: false,
  cacheDirectory: '.jest-cache',
  clearMocks: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'builder/**/*.js',
    '!builder/index.js', // Excluded from coverage (entry point)
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
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(marked)/)'
  ]
};

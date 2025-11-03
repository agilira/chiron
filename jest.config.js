module.exports = {
  testEnvironment: 'node',
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
    '^.+\\.js$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: 'current'
          }
        }]
      ]
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(marked)/)'
  ]
};

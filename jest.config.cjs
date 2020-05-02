module.exports = {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      tsConfig: "<rootDir>/jestSetup/tsconfig.jest.json",
      diagnostics: true,
    },
  },
  testEnvironment: "jsdom", // alternative "node"
  setupFiles: [],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};

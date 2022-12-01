module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: "<rootDir>/jestSetup/tsconfig.jest.json",
      diagnostics: true,
    }],
  },
  testEnvironment: "jsdom", // alternative "node"
  setupFiles: [],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};

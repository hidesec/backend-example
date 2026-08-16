module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__test__/**/*.test.ts", "**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", {}],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  modulePaths: ["<rootDir>/src"],
};
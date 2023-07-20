module.exports = {
  testEnvironment: "node",
  transform: { "^.+\\.tsx?$": "ts-jest" },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  testPathIgnorePatterns: ["/dist/", "/node_modules/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  moduleNameMapper: {
    "^eslint-redirect/(.*)": "<rootDir>/src/eslint-redirect/4.22/$1",
  },
};

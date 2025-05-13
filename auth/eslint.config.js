/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const js = require("@eslint/js");
const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = [
  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ),
  {
    ignores: ["**/node_modules/**", "**/eslint.config.js"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
      globals: {},
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },

    rules: {},
  },
  {
    files: ["**/*.ts"],
    ignores: ["**/node_modules/**", "**/eslint.config.js"],

    languageOptions: {
      globals: {},
      ecmaVersion: 5,
      sourceType: "commonjs",
    },
  },
];

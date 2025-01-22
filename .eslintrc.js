module.exports = {
    root: true,
    env: {
      browser: true,
      es2021: true,
      node: true
    },
    extends: ['standard-with-typescript'],
    overrides: [
    ],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: ['tsconfig.json'],
      tsconfigRootDir: __dirname
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/key-spacing': 'off',
      '@typescript-eslint/consistent-type-imports': 'off'
    }
  }
  
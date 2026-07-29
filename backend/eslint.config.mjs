// eslint.config.mjs — Versus Thailand ERP
// เทียบเท่า .golangci.yml สำหรับ TypeScript
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';

export default tseslint.config(
  { ignores: ['dist/', 'drizzle/', 'node_modules/', 'coverage/', 'database/', 'jest.config.ts', '*.config.*'] },

  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { prettier },
    rules: {
      // ===== เทียบเท่า golangci.yml =====

      // 🔒 Security (≈ gosec, noctx)
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-floating-promises': 'error',

      // ⚠️ Error Handling (≈ errcheck, errorlint)
      'no-throw-literal': 'error',
      '@typescript-eslint/only-throw-error': 'error',

      // 🐛 Bug Detection (≈ govet, staticcheck, nilnil)
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-return-await': 'off',
      '@typescript-eslint/return-await': 'error',

      // 🧹 Code Quality — Function Length (≈ funlen: 40 lines)
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],

      // 🧹 Cyclomatic Complexity (≈ gocyclo: 15)
      complexity: ['error', 15],

      // 🧹 Max Nesting (≈ nestif: 5)
      'max-depth': ['error', 5],
      'max-nested-callbacks': ['error', 4],

      // 🧹 Early Return (≈ revive: early-return, indent-error-flow)
      'no-else-return': 'error',
      'no-lonely-if': 'error',

      // 🧹 Code Quality
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // 🚀 Performance (≈ prealloc, makezero)
      'no-console': 'warn',

      // 📛 Naming Convention (≈ Go-style: public=PascalCase, private=camelCase)
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: ['method'],
          modifiers: ['public'],
          format: ['PascalCase'],
          leadingUnderscore: 'forbid',
        },
        {
          selector: ['method'],
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: ['function'],
          format: ['PascalCase', 'camelCase'],
        },
      ],

      // 🚫 Forbidden (≈ forbidigo: ห้ามเช็ค string == "")
      'no-restricted-syntax': [
        'error',
        {
          selector: "BinaryExpression[operator='=='] > StringLiteral",
          message: 'ใช้ === แทน == และอย่าเช็ค string ว่างด้วย == ให้ใช้ .trim() === ""',
        },
      ],
      eqeqeq: ['error', 'always'],

      // 📏 Formatting
      'prettier/prettier': 'error',
    },
  },

  // Test files — relaxed rules
  {
    files: ['**/*.test.ts', '**/tests/**'],
    rules: {
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
);

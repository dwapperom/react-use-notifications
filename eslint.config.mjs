import stylistic from '@stylistic/eslint-plugin';
import js from '@eslint/js';
import perfectionist from 'eslint-plugin-perfectionist';
import reactHooks from 'eslint-plugin-react-hooks';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'examples/*/public/**',
      'packages/ui/registry/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    jsx: true,
    arrowParens: true,
    braceStyle: '1tbs',
    commaDangle: {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'always-multiline',
    },
    quoteProps: 'as-needed',
  }),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: { ...globals.browser, ...globals.serviceworker },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { '@stylistic': stylistic, perfectionist, 'react-hooks': reactHooks, sonarjs },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          newlinesBetween: 1,
          internalPattern: ['^react-use-notifications'],
          customGroups: [
            {
              groupName: 'react',
              modifiers: ['value'],
              elementNamePattern: ['^react$', '^react-dom$', '^react/.+', '^react-dom/.+'],
            },
          ],
          groups: [
            'react',
            ['value-builtin', 'value-external'],
            ['value-internal'],
            ['value-parent', 'value-sibling', 'value-index', 'value-subpath'],
            ['type-import'],
            'unknown',
            'side-effect-style',
          ],
        },
      ],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
      '@stylistic/max-len': ['warn', { code: 100, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreRegExpLiterals: true, ignoreComments: false }],
      '@typescript-eslint/no-use-before-define': ['error', { functions: true, variables: true }],
      '@stylistic/multiline-ternary': ['error', 'always-multiline'],
      '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
      '@typescript-eslint/require-await': 'off',
      'sonarjs/cognitive-complexity': ['warn', 15],
      'no-console': ['error', { allow: ['warn', 'error', 'info', 'debug', 'assert'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/test/**/*.{ts,tsx}', '**/*.config.{ts,mts}'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      'sonarjs/cognitive-complexity': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);

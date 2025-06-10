/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

module.exports = {
  root: true,

  extends: ['@react-native'],

  plugins: ['@react-native/monorepo', '@react-native/specs'],

  overrides: [
    // overriding the JS config from @react-native/eslint-config to ensure
    // that we use hermes-eslint for all js files
    {
      files: ['*.js', '*.js.flow', '*.jsx'],
      parser: 'hermes-eslint',
      rules: {
        '@react-native/monorepo/sort-imports': 1,
        'eslint-comments/no-unlimited-disable': 0,
        'ft-flow/require-valid-file-annotation': [2, 'always'],
        'no-extra-boolean-cast': 0,
        'no-void': 0,
        // These rules are not required with hermes-eslint
        'ft-flow/define-flow-type': 0,
        'ft-flow/use-flow-type': 0,
        // Flow handles these checks for us, so they aren't required
        'no-undef': 0,
        'no-unreachable': 0,
      },
    },
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      rules: {
        '@react-native/no-deep-imports': 0,
      },
    },
    {
      files: [
        './packages/react-native/Libraries/**/*.{js,flow}',
        './packages/react-native/src/**/*.{js,flow}',
        './packages/assets/registry.js',
      ],
      parser: 'hermes-eslint',
      rules: {
        '@react-native/monorepo/no-commonjs-exports': 1,
      },
    },
    {
      files: ['package.json'],
      parser: 'jsonc-eslint-parser',
    },
    {
      files: ['package.json'],
      rules: {
        '@react-native/monorepo/react-native-manifest': 2,
      },
    },
    {
      files: ['flow-typed/**/*.js', 'packages/react-native/flow/**/*'],
      rules: {
        '@react-native/monorepo/valid-flow-typed-signature': 2,
        'ft-flow/require-valid-file-annotation': 0,
        'no-shadow': 0,
        'no-unused-vars': 0,
        quotes: 0,
      },
    },
    {
      files: [
        'packages/react-native/Libraries/**/*.js',
        'packages/react-native/src/**/*.js',
      ],
      rules: {
        '@react-native/monorepo/no-haste-imports': 2,
        '@react-native/monorepo/no-react-default-imports': 2,
        '@react-native/monorepo/no-react-named-type-imports': 2,
        '@react-native/monorepo/no-react-native-imports': 2,
        '@react-native/monorepo/no-react-node-imports': 2,
        '@react-native/monorepo/require-extends-error': 2,
        '@react-native/platform-colors': 2,
        '@react-native/specs/react-native-modules': 2,
      },
    },
    {
      files: [
        '**/__fixtures__/**/*.js',
        '**/__mocks__/**/*.js',
        '**/__tests__/**/*.js',
        'packages/react-native/jest/**/*.js',
        'packages/rn-tester/**/*.js',
      ],
      globals: {
        // Expose some Jest globals for test helpers
        afterAll: true,
        afterEach: true,
        beforeAll: true,
        beforeEach: true,
        expect: true,
        jest: true,
      },
    },
    {
      files: ['**/__tests__/**/*-test.js'],
      env: {
        jasmine: true,
        jest: true,
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'react-native/no-inline-styles': 'off',
        '@typescript-eslint/no-shadow': 'off',
        'no-self-compare': 'off',
        'react/self-closing-comp': 'off',
      },
    },
    {
      files: ['**/*.d.ts'],
      plugins: ['redundant-undefined'],
      rules: {
        'no-dupe-class-members': 'off',
        'redundant-undefined/redundant-undefined': [
          'error',
          {followExactOptionalPropertyTypes: true},
        ],
      },
    },
    {
      files: ['**/__tests__/**'],
      rules: {
        '@react-native/monorepo/no-react-native-imports': 'off',
      },
    },
  ],
};

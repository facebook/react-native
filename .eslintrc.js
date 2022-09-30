/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const path = require('node:path');

require('eslint-plugin-lint').load(path.join(__dirname, 'tools/eslint/rules'));

module.exports = {
  root: true,

  extends: ['@react-native-community'],

  plugins: ['@react-native/eslint-plugin-specs', 'lint'],

  overrides: [
    // overriding the JS config from eslint-config-react-native-community config to ensure
    // that we use hermes-eslint for all js files
    {
      files: ['*.js'],
      parser: 'hermes-eslint',
      rules: {
        // These rules are not required with hermes-eslint
        'ft-flow/define-flow-type': 0,
        'ft-flow/use-flow-type': 0,
        // flow handles this check for us, so it's not required
        'no-undef': 0,
      },
    },

    {
      files: ['Libraries/**/*.js'],
      rules: {
        '@react-native-community/platform-colors': 2,
        '@react-native/specs/react-native-modules': 2,
        'lint/no-haste-imports': 2,
        'lint/no-react-native-imports': 2,
        'lint/require-extends-error': 2,
        'lint/sort-imports': 1,
      },
    },
    {
      files: ['flow-typed/**/*.js'],
      rules: {
        'lint/valid-flow-typed-signature': 2,
        'no-unused-vars': 0,
        quotes: 0,
      },
    },
    {
      files: [
        '**/__fixtures__/**/*.js',
        '**/__mocks__/**/*.js',
        '**/__tests__/**/*.js',
        'jest/**/*.js',
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
  ],
};

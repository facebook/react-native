/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

module.exports = {
  root: true,

  extends: ['./packages/eslint-config-react-native-community/index.js'],

  plugins: ['@react-native/eslint-plugin-specs'],

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
        'flowtype/define-flow-type': 0,
        'flowtype/use-flow-type': 0,
        // flow handles this check for us, so it's not required
        'no-undef': 0,
      },
    },

    {
      files: ['Libraries/**/*.js'],
      rules: {
        '@react-native-community/no-haste-imports': 2,
        '@react-native-community/error-subclass-name': 2,
        '@react-native-community/platform-colors': 2,
        '@react-native/specs/react-native-modules': 2,
      },
    },
    {
      files: ['flow-typed/**/*.js'],
      rules: {
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
  ],
};

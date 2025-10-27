/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

const sharedConfig = require('./shared.js');

module.exports = {
  env: {
    es6: true,
  },

  parserOptions: sharedConfig.parserOptions,

  extends: ['prettier'],

  plugins: [
    'eslint-comments',
    'react',
    'react-hooks',
    'react-native',
    '@react-native',
    'jest',
  ],

  settings: sharedConfig.settings,

  overrides: [
    {
      ...sharedConfig.overrides.flow,
      parser: '@babel/eslint-parser',
      plugins: ['ft-flow'],
    },
    {
      ...sharedConfig.overrides.jsx,
      parser: '@babel/eslint-parser',
    },
    {
      ...sharedConfig.overrides.reactNative,
    },
    {
      ...sharedConfig.overrides.typescript,
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin'],
    },
    {
      ...sharedConfig.overrides.jest,
      env: {
        jest: true,
        'jest/globals': true,
      },
    },
  ],

  // Map from global var to bool specifying if it can be redefined
  globals: sharedConfig.globals,

  rules: sharedConfig.rules,
};

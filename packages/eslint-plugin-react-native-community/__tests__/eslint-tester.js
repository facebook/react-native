/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const ESLintTester = require('eslint').RuleTester;

<<<<<<< HEAD:Libraries/Sample/Sample.android.js
const Sample = {
  test: function() {
    /* $FlowFixMe(>=0.103.0 site=react_native_android_fb) This comment
     * suppresses an error found when Flow v0.103 was deployed. To see the
     * error, delete this comment and run Flow. */
    warning('Not yet implemented for Android.');
=======
ESLintTester.setDefaultConfig({
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
>>>>>>> fb/0.62-stable:packages/eslint-plugin-react-native-community/__tests__/eslint-tester.js
  },
});

module.exports = ESLintTester;

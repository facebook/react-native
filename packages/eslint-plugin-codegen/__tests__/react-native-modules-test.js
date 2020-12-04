/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react_native
 * @format
 */

'use strict';

const ESLintTester = require('./eslint-tester.js');

const rule = require('../react-native-modules');

const NATIVE_MODULES_DIR = __dirname;

const eslintTester = new ESLintTester();

const VALID_SPECS = [];

const INVALID_SPECS = [
  // Untyped NativeModule require
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(a: string): {||},
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/XYZ.js`,
    errors: [
      {
        message: rule.errors.misnamedHasteModule('XYZ'),
      },
    ],
  },
];

eslintTester.run('../react-native-modules', rule, {
  valid: VALID_SPECS,
  invalid: INVALID_SPECS,
});

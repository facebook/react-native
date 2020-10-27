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

  // Untyped NativeModule require
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(a: string): {||},
}
export default TurboModuleRegistry.get('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.untypedModuleRequire('NativeXYZ', 'get'),
      },
    ],
  },

  // Incorrectly typed NativeModule require: 0 types
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(a: string): {||},
}
export default TurboModuleRegistry.get<>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.incorrectlyTypedModuleRequire('NativeXYZ', 'get'),
      },
    ],
  },

  // Incorrectly typed NativeModule require: > 1 type
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(a: string): {||},
}
export default TurboModuleRegistry.get<Spec, 'test'>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.incorrectlyTypedModuleRequire('NativeXYZ', 'get'),
      },
    ],
  },

  // More than one TurboModuleRegistry call
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(a: string): {||},
}
const NativeModule1 = TurboModuleRegistry.get<Spec>('XYZ1');
const NativeModule2 = TurboModuleRegistry.get<Spec>('XYZ2');
export default NativeModule1 || NativeModule2;
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.multipleModuleRequires('NativeXYZ', 2),
      },
      {
        message: rule.errors.multipleModuleRequires('NativeXYZ', 2),
      },
    ],
  },

  // Called TurboModuleRegistry.getEnforcing with a variable
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(a: string): {||},
}
const moduleName = 'foo';
export default TurboModuleRegistry.get<Spec>(moduleName);
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.calledModuleRequireWithWrongType(
          'NativeXYZ',
          'get',
          'Identifier',
        ),
      },
    ],
  },
];

eslintTester.run('../react-native-modules', rule, {
  valid: VALID_SPECS,
  invalid: INVALID_SPECS,
});

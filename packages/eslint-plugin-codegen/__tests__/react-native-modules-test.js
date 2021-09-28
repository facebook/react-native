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

const VALID_SPECS = [
  // Standard specification will all supported param types.
  {
    code: `
'use strict';

import {TurboModuleRegistry, type TurboModule} from 'react-native';

export interface Spec extends TurboModule {
  func1(): void,
  func2(a: number, b: string, c: boolean): void,
  func3(a: Object, b: Array<string>, c: () => void): void,
  func4(a: ?string): void,
  func5(a: ?Object, b: ?Array<string>, c: ?() => void): void,
  func6(a: string[], b: ?number[]): void,
  func7(): string,
  func8(): Object,
  func9(): Promise<string>,
  func10(): number,
  func11(): boolean,
  func12(a: {|x: string|}): void,
  func13(a: $ReadOnlyArray<Object>): void,
  func14(): {|
    x: number,
    y: string,
  |},
  a: number,
  b: string,
  c: {a: number, b: string},
}

export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
  },

  // With convenience API wrapper
  {
    code: `
'use strict';

import {TurboModuleRegistry, type TurboModule} from 'react-native';

export interface Spec extends TurboModule {
  func1(a: Object): void,
}

const NativeModule = TurboModuleRegistry.get<Spec>('XYZ');
const NativeXYZ = {
  func1(a?: number): void {
    NativeModule.func1(a || {});
  },
};
export default NativeXYZ;
`,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
  },

  // Non-spec JS file.
  {
    code: `
'use strict';

import {Platform} from 'react-native';

export default Platform.OS;
`,
  },
];

const INVALID_SPECS = [
  // Haste module name doesn't start with "Native"
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(): void,
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/XYZ.js`,
    errors: [
      {
        message: rule.errors.invalidHasteName('XYZ'),
      },
    ],
  },

  // Invalid Spec interface name
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Foo extends TurboModule {
  func1(): void,
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.invalidNativeModuleInterfaceName('Foo'),
      },
      {
        message: rule.errors.specNotDeclaredInFile(),
      },
    ],
    output: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(): void,
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
  },

  // Missing method in Spec
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.missingSpecInterfaceMethod(),
      },
    ],
  },

  // Invalid Spec method return type
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(): XYZ,
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.unsupportedMethodReturnType('XYZ'),
      },
    ],
  },

  // Unsupported Spec property
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  id: Map<string, number>,
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.unsupportedType('Map'),
      },
    ],
  },

  // Unsupported nested Spec property
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  a: {
    b: number,
    c: () => number,
  },
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.unsupportedType('Function'),
      },
    ],
  },

  // Unsupported Spec method arg type
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
type SomeType = {};
export interface Spec extends TurboModule {
  func1(a: SomeType): void,
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.unsupportedType('SomeType'),
      },
    ],
  },

  // Unsupported Spec method arg type: optional
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(a?: string): void,
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.unsupportedType('optional string'),
      },
    ],
  },

  // Unsupported Spec method arg type: unsupported nullable
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
type Foo = {};
export interface Spec extends TurboModule {
  func1(a: ?Foo): void,
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.unsupportedType('nullable Foo'),
      },
    ],
  },

  // Unsupported Spec method arg type: generic Function
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(a: Function): void,
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.unsupportedType('Function'),
      },
    ],
  },

  // Unsupported Spec method arg type: nullable generic Function
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(a: ?Function): void,
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.unsupportedType('nullable Function'),
      },
    ],
  },

  // Spec method object return type must be exact
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(a: string): {},
}
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.inexactObjectReturnType(),
      },
    ],
  },

  // Untyped NativeModule require
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export default TurboModuleRegistry.get('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.untypedModuleRequire('get'),
      },
    ],
  },

  // Incorrectly typed NativeModule require: 0 types
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export default TurboModuleRegistry.get<>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.incorrectlyTypedModuleRequire('get'),
      },
    ],
  },

  // Incorrectly typed NativeModule require: 1 type, but wrong
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
export interface Spec extends TurboModule {
  func1(a: string): {||},
}

// According to Flow, this also conforms to TurboModule
type Spec1 = {|
  getConstants: () => {...}
|};

export default TurboModuleRegistry.get<Spec1>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.incorrectlyTypedModuleRequire('get'),
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
        message: rule.errors.incorrectlyTypedModuleRequire('get'),
      },
    ],
  },

  // NativeModule spec not declared in file
  {
    code: `
import {TurboModuleRegistry, type TurboModule} from 'react-native';
import type {Spec} from 'NativeFoo';
export default TurboModuleRegistry.get<Spec>('XYZ');
      `,
    filename: `${NATIVE_MODULES_DIR}/NativeXYZ.js`,
    errors: [
      {
        message: rule.errors.specNotDeclaredInFile(),
      },
    ],
  },
];

eslintTester.run('../react-native-modules', rule, {
  valid: VALID_SPECS,
  invalid: INVALID_SPECS,
});

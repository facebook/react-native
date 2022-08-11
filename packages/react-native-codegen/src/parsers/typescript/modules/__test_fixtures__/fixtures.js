/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// @licenselint-loose-mode

const EMPTY_NATIVE_MODULE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {

}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_COMPLEX_OBJECTS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type String = string;

export interface Spec extends TurboModule {
  // Exported methods.
  readonly getObject: (arg: {const1: {const1: boolean}}) => {
    const1: {const1: boolean},
  };
  readonly getReadOnlyObject: (arg: Readonly<{const1: Readonly<{const1: boolean}>}>) => Readonly<{
    const1: {const1: boolean},
  }>;
  readonly getObject2: (arg: { a: String }) => Object;
  readonly getObjectInArray: (arg: {const1: {const1: boolean}}) => Array<{
    const1: {const1: boolean},
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_COMPLEX_OBJECTS_WITH_NULLABLE_KEY = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type String = string;

export interface Spec extends TurboModule {
  readonly getConstants: () => {
    isTesting: boolean;
    reactNativeVersion: {
      major: number;
      minor: number;
      patch?: number;
      prerelease: number | null | undefined;
    };
    forceTouchAvailable: boolean;
    osVersion: string;
    systemName: string;
    interfaceIdiom: string;
  };
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_BASIC_PARAM_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */


import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly passBool?: (arg: boolean) => void;
  readonly passNumber: (arg: number) => void;
  readonly passString: (arg: string) => void;
  readonly passStringish: (arg: Stringish) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_ALIASES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

type NumNum = number;
export type Num = (arg: NumNum) => void;
type Num2 = Num;
export type Void = void;
export type A = number;
export type B = number;
export type ObjectAlias = {
  x: number;
  y: number;
  label: string;
  truthy: boolean;
};
export type ReadOnlyAlias = Readonly<ObjectAlias>;

export interface Spec extends TurboModule {
  // Exported methods.
  readonly getNumber: Num2;
  readonly getVoid: () => Void;
  readonly getArray: (a: Array<A>) => {a: B};
  readonly getStringFromAlias: (a: ObjectAlias) => string;
  readonly getStringFromNullableAlias: (a: ObjectAlias | null) => string;
  readonly getStringFromReadOnlyAlias: (a: ReadOnlyAlias) => string;
  readonly getStringFromNullableReadOnlyAlias: (a: ReadOnlyAlias | null) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_NESTED_ALIASES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */


import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

type Bar = {
  z: number
};

type Foo = {
  bar1: Bar,
  bar2: Bar,
};

export interface Spec extends TurboModule {
  // Exported methods.
  foo1: (x: Foo) => Foo;
  foo2: (x: Foo) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_FLOAT_AND_INT32 = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import type {Int32, Float} from 'react-native/Libraries/Types/CodegenTypes';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getInt: (arg: Int32) => Int32;
  readonly getFloat: (arg: Float) => Float;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_SIMPLE_OBJECT = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getObject: (o: Object) => Object,
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_UNSAFE_OBJECT = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import type {UnsafeObject} from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  readonly getUnsafeObject: (o: UnsafeObject) => UnsafeObject;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_ROOT_TAG = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {
  TurboModule,
  RootTag,
} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getRootTag: (rootTag: RootTag) => RootTag;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_NULLABLE_PARAM = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly voidFunc: (arg: string | null | undefined) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_BASIC_ARRAY = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getArray: (arg: Array<string>) => Array<string>;
  readonly getArray: (arg: ReadonlyArray<string>) => ReadonlyArray<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_BASIC_ARRAY2 = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getArray: (arg: string[]) => string[];
  readonly getArray: (arg: readonly string[]) => readonly string[];
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_OBJECT_WITH_OBJECT_DEFINED_IN_FILE_AS_PROPERTY = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

type DisplayMetricsAndroid = {
  width: number;
};

export interface Spec extends TurboModule {
  readonly getConstants: () => {
    readonly Dimensions: {
      windowPhysicalPixels: DisplayMetricsAndroid;
    };
  };
  readonly getConstants2: () => Readonly<{
    readonly Dimensions: {
      windowPhysicalPixels: DisplayMetricsAndroid;
    };
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_ARRAY_WITH_UNION_AND_TOUPLE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getArray: (
    arg: Array<[string, string]>,
  ) => Array<string | number | boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_ARRAY2_WITH_UNION_AND_TOUPLE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getArray: (
    arg: [string, string][],
  ) => (string | number | boolean)[];
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_ARRAY_WITH_ALIAS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type SomeString = string;

export interface Spec extends TurboModule {
  readonly getArray: (arg: Array<SomeString>) => Array<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_ARRAY2_WITH_ALIAS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type SomeString = string;

export interface Spec extends TurboModule {
  readonly getArray: (arg: SomeString[]) => string[];
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_COMPLEX_ARRAY = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getArray: (
    arg: Array<Array<Array<Array<Array<string>>>>>,
  ) => Array<Array<Array<string>>>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_COMPLEX_ARRAY2 = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getArray: (
    arg: string[][][][][],
  ) => string[][][];
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_PROMISE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type String = string;
export type SomeObj = { a: string };

export interface Spec extends TurboModule {
  readonly getValueWithPromise: () => Promise<string>;
  readonly getValueWithPromiseDefinedSomewhereElse: () => Promise<String>;
  readonly getValueWithPromiseObjDefinedSomewhereElse: () => Promise<SomeObj>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_CALLBACK = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getValueWithCallback: (
    callback: (value: string, arr: Array<Array<string>>) => void,
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const ANDROID_ONLY_NATIVE_MODULE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModuleAndroid',
);
`;

const IOS_ONLY_NATIVE_MODULE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModuleIOS',
);
`;

const CXX_ONLY_NATIVE_MODULE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getCallback: () => () => void;
  readonly getMixed: (arg: unknown) => unknown;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModuleCxx',
);
`;

module.exports = {
  NATIVE_MODULE_WITH_OBJECT_WITH_OBJECT_DEFINED_IN_FILE_AS_PROPERTY,
  NATIVE_MODULE_WITH_ARRAY_WITH_UNION_AND_TOUPLE,
  NATIVE_MODULE_WITH_ARRAY2_WITH_UNION_AND_TOUPLE,
  NATIVE_MODULE_WITH_FLOAT_AND_INT32,
  NATIVE_MODULE_WITH_ALIASES,
  NATIVE_MODULE_WITH_NESTED_ALIASES,
  NATIVE_MODULE_WITH_PROMISE,
  NATIVE_MODULE_WITH_COMPLEX_OBJECTS,
  NATIVE_MODULE_WITH_COMPLEX_OBJECTS_WITH_NULLABLE_KEY,
  NATIVE_MODULE_WITH_SIMPLE_OBJECT,
  NATIVE_MODULE_WITH_UNSAFE_OBJECT,
  NATIVE_MODULE_WITH_ROOT_TAG,
  NATIVE_MODULE_WITH_NULLABLE_PARAM,
  NATIVE_MODULE_WITH_BASIC_ARRAY,
  NATIVE_MODULE_WITH_BASIC_ARRAY2,
  NATIVE_MODULE_WITH_COMPLEX_ARRAY,
  NATIVE_MODULE_WITH_COMPLEX_ARRAY2,
  NATIVE_MODULE_WITH_ARRAY_WITH_ALIAS,
  NATIVE_MODULE_WITH_ARRAY2_WITH_ALIAS,
  NATIVE_MODULE_WITH_BASIC_PARAM_TYPES,
  NATIVE_MODULE_WITH_CALLBACK,
  EMPTY_NATIVE_MODULE,
  ANDROID_ONLY_NATIVE_MODULE,
  IOS_ONLY_NATIVE_MODULE,
  CXX_ONLY_NATIVE_MODULE,
};

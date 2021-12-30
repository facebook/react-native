/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @lint-ignore-every LICENSELINT
 */

'use strict';

const EMPTY_NATIVE_MODULE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  // no methods
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type String = string;

export interface Spec extends TurboModule {
  // Exported methods.
  +getObject: (arg: {|const1: {|const1: boolean|}|}) => {|
    const1: {|const1: boolean|},
  |};
  +getReadOnlyObject: (arg: $ReadOnly<{|const1: $ReadOnly<{|const1: boolean|}>|}>) => $ReadOnly<{|
    const1: {|const1: boolean|},
  |}>;
  +getObject2: (arg: { a: String }) => Object;
  +getObjectInArray: (arg: {const1: {|const1: boolean|}}) => Array<{|
    const1: {const1: boolean},
  |}>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {|
    isTesting: boolean,
    reactNativeVersion: {|
      major: number,
      minor: number,
      patch?: number,
      prerelease: ?number,
    |},
    forceTouchAvailable: boolean,
    osVersion: string,
    systemName: string,
    interfaceIdiom: string,
  |};
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +passBool?: (arg: boolean) => void;
  +passNumber: (arg: number) => void;
  +passString: (arg: string) => void;
  +passStringish: (arg: Stringish) => void;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

type NumNum = number;
export type Num = (arg: NumNum) => void;
type Num2 = Num;
export type Void = void;
export type A = number;
export type B = number;
export type ObjectAlias = {|
  x: number,
  y: number,
  label: string,
  truthy: boolean,
|}

export interface Spec extends TurboModule {
  // Exported methods.
  +getNumber: Num2;
  +getVoid: () => Void;
  +getArray: (a: Array<A>) => {| a: B |};
  +getStringFromAlias: (a: ObjectAlias) => string;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

type Bar = {|
  z: number
|};

type Foo = {|
  bar1: Bar,
  bar2: Bar,
|};

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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';
import type {Int32, Float} from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  +getInt: (arg: Int32) => Int32;
  +getFloat: (arg: Float) => Float;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getObject: (o: Object) => Object,
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
 * @flow strict
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';
import type {UnsafeObject} from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  +getUnsafeObject: (o: UnsafeObject) => UnsafeObject,
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {RootTag, TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getRootTag: (rootTag: RootTag) => RootTag,
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  // Exported methods.
  +voidFunc: (arg: ?string) => void;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getArray: (arg: Array<string>) => Array<string>;
  +getArray: (arg: $ReadOnlyArray<string>) => $ReadOnlyArray<string>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

type DisplayMetricsAndroid = {|
 width: number,
|};

export interface Spec extends TurboModule {
  +getConstants: () => {|
    +Dimensions: {
      windowPhysicalPixels: DisplayMetricsAndroid,
    },
  |};
  +getConstants2: () => $ReadOnly<{|
    +Dimensions: {
      windowPhysicalPixels: DisplayMetricsAndroid,
    },
  |}>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getArray: (arg: Array<[string, string]>) => Array<string | number | boolean>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type SomeString = string;

export interface Spec extends TurboModule {
  +getArray: (arg: Array<SomeString>) => Array<string>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getArray: (arg: Array<Array<Array<Array<Array<string>>>>>) => Array<Array<Array<string>>>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type String = string;
export type SomeObj = {| a: string |};

export interface Spec extends TurboModule {
  +getValueWithPromise: () => Promise<string>;
  +getValueWithPromiseDefinedSomewhereElse: () => Promise<String>;
  +getValueWithPromiseObjDefinedSomewhereElse: () => Promise<SomeObj>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  // Exported methods.
  +getValueWithCallback: (
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  // no methods
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModuleAndroid');

`;

const IOS_ONLY_NATIVE_MODULE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  // no methods
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModuleIOS');

`;

module.exports = {
  NATIVE_MODULE_WITH_OBJECT_WITH_OBJECT_DEFINED_IN_FILE_AS_PROPERTY,
  NATIVE_MODULE_WITH_ARRAY_WITH_UNION_AND_TOUPLE,
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
  NATIVE_MODULE_WITH_COMPLEX_ARRAY,
  NATIVE_MODULE_WITH_ARRAY_WITH_ALIAS,
  NATIVE_MODULE_WITH_BASIC_PARAM_TYPES,
  NATIVE_MODULE_WITH_CALLBACK,
  EMPTY_NATIVE_MODULE,
  ANDROID_ONLY_NATIVE_MODULE,
  IOS_ONLY_NATIVE_MODULE,
};

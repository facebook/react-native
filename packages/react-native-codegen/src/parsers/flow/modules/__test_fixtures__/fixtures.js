/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const EMPTY_NATIVE_MODULE = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  // mo methods
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_COMPLEX_OBJECTS = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type String = string

export interface Spec extends TurboModule {
  // Exported methods.
  +getObject: (arg: {|const1: {|const1: boolean|}|}) => {|
    const1: {|const1: boolean|},
  |};
  +getObject2: (arg: { a: String }) => Object;
  +getObjectInArray: (arg: {const1: {|const1: boolean|}}) => Array<{|
    const1: {const1: boolean},
  |}>;
}
export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_BASIC_PARAM_TYPES = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +passBool?: (arg: boolean) => void;
  +passNumber: (arg: number) => void;
  +passString: (arg: string) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_WITH_ALIASES = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
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

export interface Spec extends TurboModule {
  // Exported methods.
  +getNumber: Num2;
  +getVoid: () => Void;
  +getArray: (a : Array<A>) => {| a: B |};
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_WITH_FLOAT_AND_INT32 = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
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
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getObject(o : Object) => Object,
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_NULLABLE_PARAM = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
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
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getArray: (arg: Array<string>) => Array<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_ARRAY_WITH_ALIAS = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
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
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getArray: (arg: Array<Array<Array<Array<Array<any>>>>>) => Array<Array<Array<string>>>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_PROMISE = `/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type String = string

export interface Spec extends TurboModule {
  +getValueWithPromise: () => Promise<string>;
  +getValueWithPromiseDefinedSomewhereElse: () => Promise<String>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_CALLBACK = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
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

module.exports = {
  NATIVE_MODULE_WITH_WITH_FLOAT_AND_INT32,
  NATIVE_MODULE_WITH_WITH_ALIASES,
  NATIVE_MODULE_WITH_PROMISE,
  NATIVE_MODULE_WITH_COMPLEX_OBJECTS,
  NATIVE_MODULE_WITH_SIMPLE_OBJECT,
  NATIVE_MODULE_WITH_NULLABLE_PARAM,
  NATIVE_MODULE_WITH_BASIC_ARRAY,
  NATIVE_MODULE_WITH_COMPLEX_ARRAY,
  NATIVE_MODULE_WITH_ARRAY_WITH_ALIAS,
  NATIVE_MODULE_WITH_BASIC_PARAM_TYPES,
  NATIVE_MODULE_WITH_CALLBACK,
  EMPTY_NATIVE_MODULE,
};

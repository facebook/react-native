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

const NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT = `
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
  getString: (arg: string) => Array;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT_AS_PARAM = `
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
  getString: (arg: Array) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULES_WITH_NOT_ONLY_METHODS = `
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
  readonly getBool: (arg: boolean) => boolean;
  readonly getNumber: (arg: number) => number;
  readonly getString: (arg: string) => string;
  sampleBool: boolean,

}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULES_WITH_UNNAMED_PARAMS = `
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
  readonly getBool: (boolean) => boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULES_WITH_PROMISE_WITHOUT_TYPE = `
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
  readonly getBool: (arg: boolean) => Promise;

}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const TWO_NATIVE_MODULES_EXPORTED_WITH_DEFAULT = `
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

export default TurboModuleRegistry.getEnforcing<Spec1>('SampleTurboModule1');
export default TurboModuleRegistry.getEnforcing<Spec2>('SampleTurboModule2');
`;

const TWO_NATIVE_EXTENDING_TURBO_MODULE = `
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
  readonly getSth: (a: number | null | void) => void;
}

export interface Spec2 extends TurboModule {
  readonly getSth: (a: number | null | void) => void;
}
`;

module.exports = {
  NATIVE_MODULES_WITH_UNNAMED_PARAMS,
  NATIVE_MODULES_WITH_PROMISE_WITHOUT_TYPE,
  NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT_AS_PARAM,
  NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT,
  TWO_NATIVE_MODULES_EXPORTED_WITH_DEFAULT,
  NATIVE_MODULES_WITH_NOT_ONLY_METHODS,
  TWO_NATIVE_EXTENDING_TURBO_MODULE,
};

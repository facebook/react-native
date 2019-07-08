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

const NATIVE_MODULES_WITH_NOT_EXISTING_TYPE_AS_PARAM = `
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
  getString: (arg: NotString) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT = `
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
  getString: (arg: string) => Array;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT_AS_PARAM = `
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
  getString: (arg : Array) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULES_WITH_NOT_EXISTING_TYPE_AS_RETURN = `
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
  getString: (arg: NotString) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULES_WITH_NOT_ONLY_METHODS = `
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
  +getBool: (arg: boolean) => boolean;
  +getNumber: (arg: number) => number;
  +getString: (arg: string) => string;
  sampleBool: boolean,

}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const INCORRECT_NATIVE_MODULES = `
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

export interface SpecWithoutTypo extends TurboModule {
  // no methods
}

export default TurboModuleRegistry.getEnforcing<SpecWithTypo>('SampleTurboModule');

`;

const TWO_NATIVE_MODULES_EXPORTED_WITH_DEFAULT = `
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


export default TurboModuleRegistry.getEnforcing<Spec1>('SampleTurboModule1');
export default TurboModuleRegistry.getEnforcing<Spec2>('SampleTurboModule2');

`;

const COMMANDS_DEFINED_INLINE = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');
const codegenNativeCommands = require('codegenNativeCommands');

import type {
  Int32,
  BubblingEvent,
  DirectEvent,
} from 'CodegenTypes';

import type {ViewProps} from 'ViewPropTypes';

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No props
|}>;

export const Commands = codegenNativeCommands<{
  +hotspotUpdate: (ref: React.Ref<'RCTView'>, x: Int32, y: Int32) => void;
}>();

export default codegenNativeComponent<ModuleProps>('Module');
`;

const COMMANDS_DEFINED_MULTIPLE_TIMES = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');
const codegenNativeCommands = require('codegenNativeCommands');

import type {
  Int32,
  BubblingEvent,
  DirectEvent,
} from 'CodegenTypes';

import type {ViewProps} from 'ViewPropTypes';

interface NativeCommands {
  +hotspotUpdate: (x: Int32, y: Int32) => void;
}

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No props or events
|}>;

export const Commands = codegenNativeCommands<NativeCommands>();
export const Commands2 = codegenNativeCommands<NativeCommands>();

export default codegenNativeComponent<ModuleProps>('Module');
`;

const COMMANDS_DEFINED_WITHOUT_REF = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');
const codegenNativeCommands = require('codegenNativeCommands');

import type {
  Int32,
  BubblingEvent,
  DirectEvent,
} from 'CodegenTypes';

import type {ViewProps} from 'ViewPropTypes';

interface NativeCommands {
  +hotspotUpdate: (x: Int32, y: Int32) => void;
}

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No props or events
|}>;

export const Commands = codegenNativeCommands<NativeCommands>();

export default codegenNativeComponent<ModuleProps>('Module');
`;
const NULLABLE_WITH_DEFAULT = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {
  WithDefault,
  Float,
} from 'CodegenTypes';

import type {ViewProps} from 'ViewPropTypes';


export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  nullable_with_default: ?WithDefault<Float, 1.0>,
|}>;

export default codegenNativeComponent<ModuleProps>('Module');
`;

module.exports = {
  NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT_AS_PARAM,
  NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT,
  TWO_NATIVE_MODULES_EXPORTED_WITH_DEFAULT,
  NATIVE_MODULES_WITH_NOT_EXISTING_TYPE_AS_PARAM,
  NATIVE_MODULES_WITH_NOT_EXISTING_TYPE_AS_RETURN,
  NATIVE_MODULES_WITH_NOT_ONLY_METHODS,
  INCORRECT_NATIVE_MODULES,
  COMMANDS_DEFINED_INLINE,
  COMMANDS_DEFINED_MULTIPLE_TIMES,
  COMMANDS_DEFINED_WITHOUT_REF,
  NULLABLE_WITH_DEFAULT,
};

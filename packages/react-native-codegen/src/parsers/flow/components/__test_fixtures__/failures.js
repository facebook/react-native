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

const NON_OPTIONAL_KEY_WITH_DEFAULT_VALUE = `
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
  required_key_with_default: WithDefault<Float, 1.0>,
|}>;

export default codegenNativeComponent<ModuleProps>('Module');
`;
module.exports = {
  COMMANDS_DEFINED_INLINE,
  COMMANDS_DEFINED_MULTIPLE_TIMES,
  COMMANDS_DEFINED_WITHOUT_REF,
  NULLABLE_WITH_DEFAULT,
  NON_OPTIONAL_KEY_WITH_DEFAULT_VALUE,
};

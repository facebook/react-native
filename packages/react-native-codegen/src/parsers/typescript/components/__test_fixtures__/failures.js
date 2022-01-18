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

const COMMANDS_DEFINED_INLINE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export interface ModuleProps extends ViewProps {
  // No props
}

export const Commands = codegenNativeCommands<{
  readonly hotspotUpdate: (
    ref: React.Ref<'RCTView'>,
    x: Int32,
    y: Int32,
  ) => void;
}>({
  supportedCommands: ['hotspotUpdate'],
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const COMMANDS_DEFINED_MULTIPLE_TIMES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

interface NativeCommands {
  readonly hotspotUpdate: (
    viewRef: React.Ref<'RCTView'>,
    x: Int32,
    y: Int32,
  ) => void;
}

export interface ModuleProps extends ViewProps {
  // No props or events
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['hotspotUpdate'],
});
export const Commands2 = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['hotspotUpdate'],
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const COMMANDS_DEFINED_WITHOUT_REF = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

interface NativeCommands {
  readonly hotspotUpdate: (x: Int32, y: Int32) => void;
}

export interface ModuleProps extends ViewProps {
  // No props or events
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['hotspotUpdate'],
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const COMMANDS_DEFINED_WITH_NULLABLE_REF = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

interface NativeCommands {
  readonly hotspotUpdate: (viewRef: React.Ref<'RCTView'> | null | void, x: Int32, y: Int32) => void;
}

export interface ModuleProps extends ViewProps {
  // No props or events
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['hotspotUpdate'],
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const COMMANDS_DEFINED_WITH_MISMATCHED_METHOD_NAMES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

interface NativeCommands {
  readonly hotspotUpdate: (viewRef: React.Ref<'RCTView'>, x: Int32, y: Int32) => void;
  readonly scrollTo: (
    viewRef: React.Ref<'RCTView'>,
    y: Int32,
    animated: boolean,
  ) => void;
}

export interface ModuleProps extends ViewProps {
  // No props or events
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['scrollTo'],
});
export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const COMMANDS_DEFINED_WITHOUT_METHOD_NAMES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

interface NativeCommands {
  readonly hotspotUpdate: (viewRef: React.Ref<'RCTView'>, x: Int32, y: Int32) => void;
  readonly scrollTo: (
    viewRef: React.Ref<'RCTView'>,
    y: Int32,
    animated: boolean,
  ) => void;
}

export interface ModuleProps extends ViewProps {
  // No props or events
}

export const Commands = codegenNativeCommands<NativeCommands>();

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const NULLABLE_WITH_DEFAULT = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {WithDefault, Float} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export interface ModuleProps extends ViewProps {
  nullable_with_default: WithDefault<Float, 1.0> | null | void;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const NON_OPTIONAL_KEY_WITH_DEFAULT_VALUE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {WithDefault, Float} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export interface ModuleProps extends ViewProps {
  required_key_with_default: WithDefault<Float, 1.0>;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROPS_CONFLICT_NAMES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export interface ModuleProps extends ViewProps {
  isEnabled: string,

  isEnabled: boolean,
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROPS_CONFLICT_WITH_SPREAD_PROPS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

type PropsInFile = Readonly<{
  isEnabled: boolean,
}>;

export interface ModuleProps extends ViewProps, PropsInFile {
  isEnabled: boolean,
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROP_NUMBER_TYPE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export interface ModuleProps extends ViewProps {
  someProp: number
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROP_MIXED_ENUM = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';
import type {WithDefault} from 'CodegenTypes';

export interface ModuleProps extends ViewProps {
  someProp?: WithDefault<'foo' | 1, 1>;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROP_ENUM_BOOLEAN = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';
import type {WithDefault} from 'CodegenTypes';

export interface ModuleProps extends ViewProps {
  someProp?: WithDefault<false | true, false>
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROP_ARRAY_MIXED_ENUM = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';
import type {WithDefault} from 'CodegenTypes';

export interface ModuleProps extends ViewProps {
  someProp?: WithDefault<ReadonlyArray<'foo' | 1>, 1>;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROP_ARRAY_ENUM_BOOLEAN = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';
import type {WithDefault} from 'CodegenTypes';

export interface ModuleProps extends ViewProps {
  someProp?: WithDefault<ReadonlyArray<false | true>, false>;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROP_ARRAY_ENUM_INT = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';
import type {WithDefault} from 'CodegenTypes';

export interface ModuleProps extends ViewProps {
  someProp?: WithDefault<ReadonlyArray<0 | 1>, 0>;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

module.exports = {
  COMMANDS_DEFINED_INLINE,
  COMMANDS_DEFINED_MULTIPLE_TIMES,
  COMMANDS_DEFINED_WITH_MISMATCHED_METHOD_NAMES,
  COMMANDS_DEFINED_WITHOUT_METHOD_NAMES,
  COMMANDS_DEFINED_WITHOUT_REF,
  COMMANDS_DEFINED_WITH_NULLABLE_REF,
  NULLABLE_WITH_DEFAULT,
  NON_OPTIONAL_KEY_WITH_DEFAULT_VALUE,
  PROPS_CONFLICT_NAMES,
  PROPS_CONFLICT_WITH_SPREAD_PROPS,
  PROP_NUMBER_TYPE,
  PROP_MIXED_ENUM,
  PROP_ENUM_BOOLEAN,
  PROP_ARRAY_MIXED_ENUM,
  PROP_ARRAY_ENUM_BOOLEAN,
  PROP_ARRAY_ENUM_INT,
};

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

const COMMANDS_EXPORTED_WITH_DIFFERENT_NAME = `
// @flow

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {NativeComponentType} from 'codegenNativeComponent';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

type NativeType = NativeComponentType<ModuleProps>;

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.ElementRef<NativeType>) => void;
}

export const Foo = codegenNativeCommands<NativeCommands>();

export default (codegenNativeComponent<ModuleProps>('Module'): NativeType);
`;

const OTHER_COMMANDS_EXPORT = `
// @flow

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {NativeComponentType} from 'codegenNativeComponent';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

type NativeType = NativeComponentType<ModuleProps>;

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.ElementRef<NativeType>) => void;
}

export const Commands = 4;

export default (codegenNativeComponent<ModuleProps>('Module'): NativeType);
`;

const COMMANDS_EXPORTED_WITH_SHORTHAND = `
// @flow

const codegenNativeComponent = require('codegenNativeComponent');
import type {NativeComponentType} from 'codegenNativeComponent';

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

type NativeType = NativeComponentType<ModuleProps>;

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.ElementRef<NativeType>) => void;
}

const Commands = 4;

export {Commands};

export default (codegenNativeComponent<ModuleProps>('Module'): NativeType);
`;

const COMMANDS_WITH_COVERAGE_INVALID = `
// @flow

const codegenNativeComponent = require('codegenNativeComponent');
import type {NativeComponentType} from 'codegenNativeComponent';

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

type NativeType = NativeComponentType<ModuleProps>;

// Coverage instrumentation of invalid Commands export - should still fail
export const Commands = (cov_1234567890().s[0]++, {
  hotspotUpdate: () => {},
  scrollTo: () => {},
});

export default (codegenNativeComponent<ModuleProps>('Module'): NativeType);
`;

const COMMANDS_WITH_COVERAGE_WRONG_FUNCTION = `
// @flow

const codegenNativeComponent = require('codegenNativeComponent');
import type {NativeComponentType} from 'codegenNativeComponent';

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

type NativeType = NativeComponentType<ModuleProps>;

// Coverage instrumentation of wrong function call - should fail
export const Commands = (cov_abcdef123().s[0]++, someOtherFunction({
  supportedCommands: ['pause', 'play'],
}));

export default (codegenNativeComponent<ModuleProps>('Module'): NativeType);
`;

const COMMANDS_WITH_COMPLEX_COVERAGE_INVALID = `
// @flow

const codegenNativeComponent = require('codegenNativeComponent');
import type {NativeComponentType} from 'codegenNativeComponent';

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

type NativeType = NativeComponentType<ModuleProps>;

// Complex coverage instrumentation with invalid nested structure - should fail
export const Commands = (
  cov_xyz789().f[1]++,
  cov_xyz789().s[2]++,
  {
    pause: (ref) => {},
    play: (ref) => {},
  }
);

export default (codegenNativeComponent<ModuleProps>('Module'): NativeType);
`;

const COMMANDS_WITH_COVERAGE_WRONG_NAME = `
// @flow

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');
import type {NativeComponentType} from 'codegenNativeComponent';

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

type NativeType = NativeComponentType<ModuleProps>;

interface NativeCommands {
  +pause: (viewRef: React.ElementRef<NativeType>) => void;
  +play: (viewRef: React.ElementRef<NativeType>) => void;
}

// Coverage instrumentation with correct function but wrong export name - should fail
export const WrongName = (cov_wrong123().s[0]++, codegenNativeCommands<NativeCommands>({
  supportedCommands: ['pause', 'play'],
}));

export default (codegenNativeComponent<ModuleProps>('Module'): NativeType);
`;

const COMMANDS_WITH_COVERAGE_TYPE_CAST_INVALID = `
// @flow

const codegenNativeComponent = require('codegenNativeComponent');
import type {NativeComponentType} from 'codegenNativeComponent';

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

type NativeType = NativeComponentType<ModuleProps>;

interface NativeCommands {
  +pause: (viewRef: React.ElementRef<NativeType>) => void;
  +play: (viewRef: React.ElementRef<NativeType>) => void;
}

// Coverage instrumentation with type cast but wrong function - should fail
export const Commands: NativeCommands = (cov_cast123().s[0]++, invalidFunction({
  supportedCommands: ['pause', 'play'],
}));

export default (codegenNativeComponent<ModuleProps>('Module'): NativeType);
`;

module.exports = {
  'CommandsExportedWithDifferentNameNativeComponent.js':
    COMMANDS_EXPORTED_WITH_DIFFERENT_NAME,
  'CommandsExportedWithShorthandNativeComponent.js':
    COMMANDS_EXPORTED_WITH_SHORTHAND,
  'OtherCommandsExportNativeComponent.js': OTHER_COMMANDS_EXPORT,
  'CommandsWithCoverageInvalidNativeComponent.js':
    COMMANDS_WITH_COVERAGE_INVALID,
  'CommandsWithCoverageWrongFunctionNativeComponent.js':
    COMMANDS_WITH_COVERAGE_WRONG_FUNCTION,
  'CommandsWithComplexCoverageInvalidNativeComponent.js':
    COMMANDS_WITH_COMPLEX_COVERAGE_INVALID,
  'CommandsWithCoverageWrongNameNativeComponent.js':
    COMMANDS_WITH_COVERAGE_WRONG_NAME,
  'CommandsWithCoverageTypeCastInvalidNativeComponent.js':
    COMMANDS_WITH_COVERAGE_TYPE_CAST_INVALID,
};

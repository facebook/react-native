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

module.exports = {
  'CommandsExportedWithDifferentNameNativeComponent.js':
    COMMANDS_EXPORTED_WITH_DIFFERENT_NAME,
  'CommandsExportedWithShorthandNativeComponent.js':
    COMMANDS_EXPORTED_WITH_SHORTHAND,
  'OtherCommandsExportNativeComponent.js': OTHER_COMMANDS_EXPORT,
};

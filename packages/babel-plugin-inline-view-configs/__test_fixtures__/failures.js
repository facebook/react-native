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

const COMMANDS_EXPORTED_WITH_DIFFERENT_NAME = `
// @flow

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.Ref<'Module'>) => void;
}

export const Foo = codegenNativeCommands<NativeCommands>();

export default codegenNativeComponent<ModuleProps>('Module');
`;

const OTHER_COMMANDS_EXPORT = `
// @flow

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.Ref<'Module'>) => void;
}

export const Commands = 4;

export default codegenNativeComponent<ModuleProps>('Module');
`;

const COMMANDS_EXPORTED_WITH_SHORTHAND = `
// @flow

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.Ref<'Module'>) => void;
}

const Commands = 4;

export {Commands};

export default codegenNativeComponent<ModuleProps>('Module');
`;

module.exports = {
  'CommandsExportedWithDifferentNameNativeComponent.js': COMMANDS_EXPORTED_WITH_DIFFERENT_NAME,
  'CommandsExportedWithShorthandNativeComponent.js': COMMANDS_EXPORTED_WITH_SHORTHAND,
  'OtherCommandsExportNativeComponent.js': OTHER_COMMANDS_EXPORT,
};

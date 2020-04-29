/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
<<<<<<< HEAD
 * @flow
=======
 * @flow strict-local
>>>>>>> fb/0.62-stable
 * @format
 */

'use strict';

const COMMANDS_EXPORTED_WITH_DIFFERENT_NAME = `
// @flow

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
<<<<<<< HEAD
=======
import type {NativeComponent} from 'codegenNativeComponent';
>>>>>>> fb/0.62-stable

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

<<<<<<< HEAD
interface NativeCommands {
  +hotspotUpdate: (viewRef: React.Ref<'Module'>) => void;
=======
type NativeType = NativeComponent<ModuleProps>;

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.ElementRef<NativeType>) => void;
>>>>>>> fb/0.62-stable
}

export const Foo = codegenNativeCommands<NativeCommands>();

<<<<<<< HEAD
export default codegenNativeComponent<ModuleProps>('Module');
=======
export default (codegenNativeComponent<ModuleProps>('Module'): NativeType);
>>>>>>> fb/0.62-stable
`;

const OTHER_COMMANDS_EXPORT = `
// @flow

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
<<<<<<< HEAD
=======
import type {NativeComponent} from 'codegenNativeComponent';
>>>>>>> fb/0.62-stable

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

<<<<<<< HEAD
interface NativeCommands {
  +hotspotUpdate: (viewRef: React.Ref<'Module'>) => void;
=======
type NativeType = NativeComponent<ModuleProps>;

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.ElementRef<NativeType>) => void;
>>>>>>> fb/0.62-stable
}

export const Commands = 4;

<<<<<<< HEAD
export default codegenNativeComponent<ModuleProps>('Module');
=======
export default (codegenNativeComponent<ModuleProps>('Module'): NativeType);
>>>>>>> fb/0.62-stable
`;

const COMMANDS_EXPORTED_WITH_SHORTHAND = `
// @flow

const codegenNativeComponent = require('codegenNativeComponent');
<<<<<<< HEAD
=======
import type {NativeComponent} from 'codegenNativeComponent';
>>>>>>> fb/0.62-stable

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

<<<<<<< HEAD
interface NativeCommands {
  +hotspotUpdate: (viewRef: React.Ref<'Module'>) => void;
=======
type NativeType = NativeComponent<ModuleProps>;

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.ElementRef<NativeType>) => void;
>>>>>>> fb/0.62-stable
}

const Commands = 4;

export {Commands};

<<<<<<< HEAD
export default codegenNativeComponent<ModuleProps>('Module');
=======
export default (codegenNativeComponent<ModuleProps>('Module'): NativeType);
>>>>>>> fb/0.62-stable
`;

module.exports = {
  'CommandsExportedWithDifferentNameNativeComponent.js': COMMANDS_EXPORTED_WITH_DIFFERENT_NAME,
  'CommandsExportedWithShorthandNativeComponent.js': COMMANDS_EXPORTED_WITH_SHORTHAND,
  'OtherCommandsExportNativeComponent.js': OTHER_COMMANDS_EXPORT,
};

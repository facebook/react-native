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
const NOT_A_NATIVE_COMPONENT = `
const requireNativeComponent = require('requireNativeComponent').default;

export default 'Not a view config'
`;

const FULL_NATIVE_COMPONENT = `
// @flow

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {
  Int32,
  BubblingEventHandler,
  DirectEventHandler,
  WithDefault,
} from 'CodegenFlowtypes';
import type {NativeComponentType} from 'codegenNativeComponent';

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  boolean_default_true_optional_both?: WithDefault<boolean, true>,

  // Events
  onDirectEventDefinedInlineNull: DirectEventHandler<null>,
  onBubblingEventDefinedInlineNull: BubblingEventHandler<null>,
|}>;

type NativeType = NativeComponentType<ModuleProps>;

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.ElementRef<NativeType>, x: Int32, y: Int32) => void;
  +scrollTo: (viewRef: React.ElementRef<NativeType>, y: Int32, animated: boolean) => void;
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['hotspotUpdate', 'scrollTo'],
});

export default codegenNativeComponent<ModuleProps>('Module', {
  interfaceOnly: true,
  paperComponentName: 'RCTModule',
});
`;

// Coverage instrumentation test cases - should be recognized as valid
const COMMANDS_WITH_SIMPLE_COVERAGE = `
// @flow

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {NativeComponentType} from 'codegenNativeComponent';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

type NativeType = NativeComponentType<ModuleProps>;

interface NativeCommands {
  +pause: (viewRef: React.ElementRef<NativeType>) => void;
  +play: (viewRef: React.ElementRef<NativeType>) => void;
}

export const Commands = (cov_1234567890.s[0]++, codegenNativeCommands<NativeCommands>({
  supportedCommands: ['pause', 'play'],
}));

export default codegenNativeComponent<ModuleProps>('Module');
`;

const COMMANDS_WITH_COMPLEX_COVERAGE = `
// @flow

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {NativeComponentType} from 'codegenNativeComponent';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

type NativeType = NativeComponentType<ModuleProps>;

interface NativeCommands {
  +seek: (viewRef: React.ElementRef<NativeType>, position: number) => void;
  +stop: (viewRef: React.ElementRef<NativeType>) => void;
}

export const Commands = (
  cov_abcdef123().f[2]++,
  cov_abcdef123().s[5]++,
  codegenNativeCommands<NativeCommands>({
    supportedCommands: ['seek', 'stop'],
  })
);

export default codegenNativeComponent<ModuleProps>('Module');
`;

const COMMANDS_WITH_TYPE_CAST_COVERAGE = `
// @flow

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {NativeComponentType} from 'codegenNativeComponent';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
|}>;

type NativeType = NativeComponentType<ModuleProps>;

interface NativeCommands {
  +mute: (viewRef: React.ElementRef<NativeType>) => void;
  +unmute: (viewRef: React.ElementRef<NativeType>) => void;
}

export const Commands: NativeCommands = (cov_xyz789().s[1]++, codegenNativeCommands<NativeCommands>({
  supportedCommands: ['mute', 'unmute'],
}));

export default codegenNativeComponent<ModuleProps>('Module');
`;

const FULL_NATIVE_COMPONENT_WITH_TYPE_EXPORT = `
// @flow

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');
import type {NativeComponentType} from 'codegenNativeComponent';

import type {
  Int32,
  BubblingEventHandler,
  DirectEventHandler,
  WithDefault,
} from 'CodegenFlowtypes';

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  boolean_default_true_optional_both?: WithDefault<boolean, true>,

  // Events
  onDirectEventDefinedInlineNull: DirectEventHandler<null>,
  onBubblingEventDefinedInlineNull: BubblingEventHandler<null>,
|}>;

type NativeType = NativeComponentType<ModuleProps>;

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.ElementRef<NativeType>, x: Int32, y: Int32) => void;
  +scrollTo: (viewRef: React.ElementRef<NativeType>, y: Int32, animated: boolean) => void;
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['hotspotUpdate', 'scrollTo'],
});

export default (codegenNativeComponent<ModuleProps>('Module', {
  interfaceOnly: true,
  paperComponentName: 'RCTModule',
}): NativeType);
`;

module.exports = {
  'NotANativeComponent.js': NOT_A_NATIVE_COMPONENT,
  'FullNativeComponent.js': FULL_NATIVE_COMPONENT,
  'FullTypedNativeComponent.js': FULL_NATIVE_COMPONENT_WITH_TYPE_EXPORT,
  'CommandsWithSimpleCoverageNativeComponent.js': COMMANDS_WITH_SIMPLE_COVERAGE,
  'CommandsWithComplexCoverageNativeComponent.js':
    COMMANDS_WITH_COMPLEX_COVERAGE,
  'CommandsWithTypeCastCoverageNativeComponent.js':
    COMMANDS_WITH_TYPE_CAST_COVERAGE,
};

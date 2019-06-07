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
const NOT_A_NATIVE_COMPONENT = `
const requireNativeComponent = require('requireNativeComponent');

export default 'Not a view config'
`;

const FULL_NATIVE_COMPONENT = `
const requireNativeComponent = require('requireNativeComponent');

import type {
  BubblingEvent,
  DirectEvent,
  WithDefault,
  CodegenNativeComponent,
} from 'CodegenFlowtypes';

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  boolean_default_true_optional_both?: ?WithDefault<boolean, true>,

  // Events
  onDirectEventDefinedInlineNull: (event: DirectEvent<null>) => void,
  onBubblingEventDefinedInlineNull: (event: BubblingEvent<null>) => void,
|}>;

type Options = {
  interfaceOnly: true,
  isDeprecatedPaperComponentNameRCT: true,
};

type ModuleType = CodegenNativeComponent<'Module', ModuleProps, Options>;

module.exports = ((requireNativeComponent('RCTModule'): any): ModuleType);
`;

module.exports = {
  'NotANativeComponent.js': NOT_A_NATIVE_COMPONENT,
  'FullNativeComponent.js': FULL_NATIVE_COMPONENT,
};

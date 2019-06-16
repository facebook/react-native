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
const codegenNativeComponent = require('codegenNativeComponent');

import type {
  BubblingEvent,
  DirectEvent,
  WithDefault,
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

export default codegenNativeComponent<ModuleProps>('Module', {
  interfaceOnly: true,
  isDeprecatedPaperComponentNameRCT: true,
});
`;

module.exports = {
  'NotANativeComponent.js': NOT_A_NATIVE_COMPONENT,
  'FullNativeComponent.js': FULL_NATIVE_COMPONENT,
};

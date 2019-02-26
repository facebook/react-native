/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const requireNativeComponent = require('requireNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {NativeComponent} from 'ReactNative';

type NativeProps = $ReadOnly<{|
  ...ViewProps,
|}>;

type RCTMaskedViewNativeType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'RCTMaskedView',
): any): RCTMaskedViewNativeType);

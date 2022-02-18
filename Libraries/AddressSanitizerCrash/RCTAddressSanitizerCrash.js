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
import type {HostComponent} from '../Renderer/shims/ReactNativeTypes';
import type {ViewProps} from '../Components/View/ViewPropTypes';

const {requireNativeComponent} = require('react-native');

type NativeProps = $ReadOnly<{|
  ...ViewProps,
|}>;

const RCTAddressSanitizerCrash: HostComponent<NativeProps> = requireNativeComponent<NativeProps>(
  'RCTAddressSanitizerCrash',
);

module.exports = RCTAddressSanitizerCrash;

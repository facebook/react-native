/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

import type {ViewProps} from '../View/ViewPropTypes';
import type {NativeComponent} from '../../Renderer/shims/ReactNative';

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  emulateUnlessSupported?: boolean,
|}>;

type RCTSafeAreaViewNativeType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'RCTSafeAreaView',
): any): RCTSafeAreaViewNativeType);

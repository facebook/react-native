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

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

import type {ViewProps} from '../View/ViewPropTypes';
import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {NativeComponent} from '../../Renderer/shims/ReactNative';

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  name?: ?string,
  style?: ?ViewStyleProp,
|}>;

type UnimplementedViewNativeType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'UnimplementedNativeView',
): any): UnimplementedViewNativeType);

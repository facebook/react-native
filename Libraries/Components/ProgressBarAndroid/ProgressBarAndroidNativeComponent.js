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

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

import type {ViewProps} from '../View/ViewPropTypes';
import type {NativeComponent} from '../../Renderer/shims/ReactNative';

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  styleAttr?: string,
  typeAttr?: string,
  indeterminate: boolean,
  progress?: number,
  animating?: ?boolean,
  color?: ?string,
  testID?: ?string,
|}>;

type ProgressBarAndroidType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'AndroidProgressBar',
): any): ProgressBarAndroidType);

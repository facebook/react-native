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

const ReactNative = require('ReactNative');

const requireNativeComponent = require('requireNativeComponent');

import type {ViewProps} from 'ViewPropTypes';

/* $FlowFixMe(>=0.89.0 site=react_native_fb) This comment suppresses an error
 * found when Flow v0.89 was deployed. To see the error, delete this comment
 * and run Flow. */
type ViewNativeComponentType = Class<ReactNative.NativeComponent<ViewProps>>;

const NativeViewComponent = requireNativeComponent('RCTView');

module.exports = ((NativeViewComponent: any): ViewNativeComponentType);

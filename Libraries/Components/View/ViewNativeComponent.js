/**
 * Copyright (c) 2015-present, Facebook, Inc.
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

type ViewNativeComponentType = Class<ReactNative.NativeComponent<ViewProps>>;

const NativeViewComponent = requireNativeComponent('RCTView');

module.exports = ((NativeViewComponent: any): ViewNativeComponentType);

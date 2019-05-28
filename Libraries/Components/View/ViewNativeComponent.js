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

const ReactNative = require('../../Renderer/shims/ReactNative');

import type {ViewProps} from './ViewPropTypes';

type ViewNativeComponentType = Class<ReactNative.NativeComponent<ViewProps>>;

require('ReactNativeViewViewConfig');

module.exports = (('RCTView': any): ViewNativeComponentType);

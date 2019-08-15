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

const NativeEventEmitter = require('../../EventEmitter/NativeEventEmitter');

/* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found when
 * making Flow check .android.js files. */
module.exports = new NativeEventEmitter('StatusBarManager');

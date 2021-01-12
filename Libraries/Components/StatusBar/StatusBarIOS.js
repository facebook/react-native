/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import NativeEventEmitter from '../../EventEmitter/NativeEventEmitter';
import NativeStatusBarManagerIOS from './NativeStatusBarManagerIOS';

type StatusBarFrameChangeEvent = {
  frame: {
    x: number,
    y: number,
    width: number,
    height: number,
  },
};

type StatusBarIOSEventDefinitions = {
  statusBarFrameDidChange: [StatusBarFrameChangeEvent],
  statusBarFrameWillChange: [StatusBarFrameChangeEvent],
};

/**
 * Use `StatusBar` for mutating the status bar.
 */
class StatusBarIOS extends NativeEventEmitter<StatusBarIOSEventDefinitions> {}

module.exports = (new StatusBarIOS(NativeStatusBarManagerIOS): StatusBarIOS);

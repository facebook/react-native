/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import NativeEventEmitter from '../../EventEmitter/NativeEventEmitter';
import NativeStatusBarManagerIOS from './NativeStatusBarManagerIOS';
import Platform from '../../Utilities/Platform';

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

module.exports = (new StatusBarIOS(
  // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
  // If you want to use the native module on other platforms, please remove this condition and test its behavior
  Platform.OS !== 'ios' ? null : NativeStatusBarManagerIOS,
): StatusBarIOS);

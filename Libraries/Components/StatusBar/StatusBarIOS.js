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

const NativeEventEmitter = require('../../EventEmitter/NativeEventEmitter');

<<<<<<< HEAD:Libraries/Components/StatusBar/StatusBarIOS.ios.js
import NativeStatusBarManager from './NativeStatusBarManager';
=======
import NativeStatusBarManagerIOS from './NativeStatusBarManagerIOS';
>>>>>>> fb/0.62-stable:Libraries/Components/StatusBar/StatusBarIOS.js

/**
 * Use `StatusBar` for mutating the status bar.
 */
class StatusBarIOS extends NativeEventEmitter {}

<<<<<<< HEAD:Libraries/Components/StatusBar/StatusBarIOS.ios.js
module.exports = (new StatusBarIOS(NativeStatusBarManager): StatusBarIOS);
=======
module.exports = (new StatusBarIOS(NativeStatusBarManagerIOS): StatusBarIOS);
>>>>>>> fb/0.62-stable:Libraries/Components/StatusBar/StatusBarIOS.js

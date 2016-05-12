/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule StatusBarIOS
 * @flow
 */
'use strict';

const NativeEventEmitter = require('NativeEventEmitter');
const StatusBar = require('StatusBar');
const StatusBarManager = require('NativeModules').StatusBarManager;

import type {StatusBarStyle, StatusBarAnimation} from 'StatusBar';

/**
 * Deprecated. Use `StatusBar` instead.
 */
class StatusBarIOS extends NativeEventEmitter {

  setStyle(style: StatusBarStyle, animated?: boolean) {
    console.warn('`StatusBarIOS.setStyle` is deprecated. Use `StatusBar.setBarStyle` instead.');
    StatusBar.setBarStyle(style, animated);
  }

  setHidden(hidden: boolean, animation?: StatusBarAnimation) {
    console.warn('`StatusBarIOS.setHidden` is deprecated. Use `StatusBar.setHidden` instead.');
    StatusBar.setHidden(hidden, animation);
  }

  setNetworkActivityIndicatorVisible(visible: boolean) {
    console.warn(
      '`StatusBarIOS.setNetworkActivityIndicatorVisible` is deprecated. ' +
      'Use `StatusBar.setNetworkActivityIndicatorVisible` instead.'
    );
    StatusBar.setNetworkActivityIndicatorVisible(visible);
  }
}

module.exports = new StatusBarIOS(StatusBarManager);

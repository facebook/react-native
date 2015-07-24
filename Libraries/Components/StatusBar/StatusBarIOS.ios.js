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

var RCTStatusBarManager = require('NativeModules').StatusBarManager;

type StatusBarStyle = $Enum<{
  'default': string,
  'light-content': string,
}>;

type StatusBarAnimation = $Enum<{
  'none': string,
  'fade': string,
  'slide': string,
}>;

var StatusBarIOS = {

  setStyle(style: StatusBarStyle, animated?: boolean) {
    animated = animated || false;
    RCTStatusBarManager.setStyle(style, animated);
  },

  setHidden(hidden: boolean, animation?: StatusBarAnimation) {
    animation = animation || 'none';
    RCTStatusBarManager.setHidden(hidden, animation);
  },

  setNetworkActivityIndicatorVisible(visible: boolean) {
    RCTStatusBarManager.setNetworkActivityIndicatorVisible(visible);
  },
};

module.exports = StatusBarIOS;

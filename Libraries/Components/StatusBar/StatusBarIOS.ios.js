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

var StatusBarIOS = {

  Style: {
    default: RCTStatusBarManager.Style.default,
    lightContent: RCTStatusBarManager.Style.lightContent
  },

  Animation: {
    none: RCTStatusBarManager.Animation.none,
    fade: RCTStatusBarManager.Animation.fade,
    slide: RCTStatusBarManager.Animation.slide,
  },

  setStyle(style: number, animated?: boolean) {
    animated = animated || false;
    RCTStatusBarManager.setStyle(style, animated);
  },

  setHidden(hidden: boolean, animation: number) {
    animation = animation || StatusBarIOS.Animation.none;
    RCTStatusBarManager.setHidden(hidden, animation);
  },
};

module.exports = StatusBarIOS;

/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule StatusBarIOS
 * @flow
 */
'use strict';

var { RCTStatusBarManager } = require('NativeModules');

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

  setStyle(style: number, animated: boolean) {
    animated = animated || false;
    RCTStatusBarManager.setStyle(style, animated);
  },

  setHidden(hidden: boolean, animation: number) {
    animation = animation || StatusBarIOS.Animation.none;
    RCTStatusBarManager.setHidden(hidden, animation);
  },
};

module.exports = StatusBarIOS;

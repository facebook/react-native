/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule StatusBarIOS
 * @flow
 */
'use strict';

var { RKStatusBarManager } = require('NativeModules');

var StatusBarIOS = {

  Style: {
    default: RKStatusBarManager.Style.default,
    lightContent: RKStatusBarManager.Style.lightContent
  },

  Animation: {
    none: RKStatusBarManager.Animation.none,
    fade: RKStatusBarManager.Animation.fade,
    slide: RKStatusBarManager.Animation.slide,
  },

  setStyle(style: number, animated: boolean) {
    animated = animated || false;
    RKStatusBarManager.setStyle(style, animated);
  },

  setHidden(hidden: boolean, animation: number) {
    animation = animation || StatusBarIOS.Animation.none;
    RKStatusBarManager.setHidden(hidden, animation);
  },
};

module.exports = StatusBarIOS;

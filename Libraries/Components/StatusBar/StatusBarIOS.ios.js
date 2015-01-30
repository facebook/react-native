/**
 * @providesModule StatusBarIOS
 */
'use strict';

var { RCTStatusBarManager } = require('NativeModules');
 
var StatusBarIOS = {
  style: {
    default: 0,
    lightContent: 1,
  },

  animation: {
    none: 0,
    fade: 1,
    slide: 2,
  },

  setStyle(style, animated) {
    animated = animated || false;
    RCTStatusBarManager.setStatusBarStyle(style, animated);
  },

  setHidden(hidden, animation) {
    animation = animation || StatusBarIOS.animation.none;
    RCTStatusBarManager.setStatusBarHidden(hidden, animation);
  },
};

module.exports = StatusBarIOS;

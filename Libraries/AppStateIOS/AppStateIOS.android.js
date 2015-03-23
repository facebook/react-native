/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule AppStateIOS
 */
'use strict';

var warning = require('warning');

class AppStateIOS {

  static addEventListener(type, handler) {
    warning('Cannot listen to AppStateIOS events on Android.');
  }

  static removeEventListener(type, handler) {
    warning('Cannot remove AppStateIOS listener on Android.');
  }

}

AppStateIOS.currentState = null;

module.exports = AppStateIOS;

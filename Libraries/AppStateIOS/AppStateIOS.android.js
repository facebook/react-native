/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AppStateIOS
 * @flow
 */
'use strict';

var warning = require('warning');

class AppStateIOS {

  static addEventListener(type, handler) {
    warning(false, 'Cannot listen to AppStateIOS events on Android.');
  }

  static removeEventListener(type, handler) {
    warning(false, 'Cannot remove AppStateIOS listener on Android.');
  }

}

AppStateIOS.currentState = null;

module.exports = AppStateIOS;

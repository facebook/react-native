/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * BackAndroid has been moved to BackHandler.  This stub calls BackHandler methods
 * after generating a warning to remind users to move to the new BackHandler module.
 *
 * @providesModule BackAndroid
 */

'use strict';

var BackHandler = require('BackHandler');

var warning = require('fbjs/lib/warning');

/**
 * Deprecated.  Use BackHandler instead.
 */
var BackAndroid = {

  exitApp: function() {
    warning(false, 'BackAndroid is deprecated.  Please use BackHandler instead.');
    BackHandler.exitApp();
  },

  addEventListener: function (
    eventName: BackPressEventName,
    handler: Function
  ): {remove: () => void} {
    warning(false, 'BackAndroid is deprecated.  Please use BackHandler instead.');
    return BackHandler.addEventListener(eventName, handler);
  },

  removeEventListener: function(
    eventName: BackPressEventName,
    handler: Function
  ): void {
    warning(false, 'BackAndroid is deprecated.  Please use BackHandler instead.');
    BackHandler.removeEventListener(eventName, handler);
  },

};

module.exports = BackAndroid;

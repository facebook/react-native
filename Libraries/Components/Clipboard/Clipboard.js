/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Clipboard
 */
'use strict';

var Clipboard = require('NativeModules').Clipboard;

/**
 * `Clipboard` gives you an interface for setting and getting content from Clipboard on both iOS and Android
 */
module.exports = {
  /**
   * Get content of string type, this method returns a `Promise`, so you can use following code to get clipboard content
   * ```javascript
   * async _getContent() {
   *   var content = await Clipboard.getString();
   * }
   * ```
   */
  getString() {
    if (arguments.length > 0) {
      let callback = arguments[0];
      console.warn('Clipboard.getString(callback) is deprecated. Use the returned Promise instead');
      Clipboard.getString().then(callback);
      return;
    }
    return Clipboard.getString();
  },
  /**
   * Set content of string type. You can use following code to set clipboard content
   * ```javascript
   * _setContent() {
   *   Clipboard.setString('hello world');
   * }
   * ```
   * @param the content to be stored in the clipboard.
   */
  setString(content) {
    Clipboard.setString(content);
  }
};

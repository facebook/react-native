/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Clipboard
 * @flow
 */
'use strict';
const NativeEventEmitter = require('NativeEventEmitter');
const RCTClipboard = require('NativeModules').Clipboard;

/**
 * `Clipboard` gives you an interface for setting and getting content of the
 * Clipboard on both iOS and Android. You can subscribe to `clipboardChanged`,
 * and `Clipboard` will tell you when the content has changed.
 */
class Clipboard extends NativeEventEmitter {

  /**
   * Do not use. The exported module will be a Singleton instance.
   */
  constructor() {
    super(RCTClipboard);
  }

  /**
   * Add a handler to Clipboard changes by listening to the `clipboardChanged` event type
   * and providing the handler.
   * Example usage:
   * ```javascript
   * componentDidMount(){
   *   Clipboard.addListener('clipboardChanged', this._clipboardChanged.bind(this));
   * }
   *
   * componentWillUnmount(){
   *   Clipboard.removeListener('clipboardChanged', this._clipboardChanged);
   * }
   * ```
   */
  addEventListener(type: string, handler: Function) {
    this.addListener(type, handler);
  }

  /**
   * Remove a handler by passing the `clipboardChanged` event type and the handler
   */
  removeEventListener(type: string, handler: Function ) {
    this.removeListener(type, handler);
  }

  /**
   * Get content of string type, this method returns a `Promise`, so you can
   * use following code to get clipboard content:
   * ```javascript
   * async _getContent() {
   *   var content = await Clipboard.getString();
   * }
   * ```
   */
  getString(): Promise<String>{
    return RCTClipboard.getString();
  }

  /**
   * Set content of string type. You can use following code to set clipboard content
   * ```javascript
   * _setContent() {
   *   Clipboard.setString('hello world');
   * }
   * ```
   * @param the content to be stored in the clipboard.
   */
  setString(content: string){
    RCTClipboard.setString(content);
  }
}

module.exports = new Clipboard();

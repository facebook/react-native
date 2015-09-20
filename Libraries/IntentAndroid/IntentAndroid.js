/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule IntentAndroid
 * @flow
 */
'use strict';

var IntentManager = require('NativeModules').IntentManager;
var invariant = require('invariant');

/**
 * `IntentAndroid` gives you a general interface to interact with outgoing
 * app links.
 *
 * ### Basic Usage
 *
 * #### Triggering App links
 *
 * To trigger an app link (browser, email or custom schemas) you call
 *
 * ```
 * IntentAndroid.openURL(url)
 * ```
 *
 * If you want to check if any installed app can handle a given url beforehand you can call
 * ```
 * IntentAndroid.canOpenURL(url, (supported) => {
 *   if (!supported) {
 *     ToastAndroid.show('Can\'t handle url: ' + url, ToastAndroid.LONG);
 *   } else {
 *     IntentAndroid.openURL(url);
 *   }
 * });
 * ```
 */
class IntentAndroid {

  /**
   * Try to open the given `url` with any of the installed apps.
   */
  static openURL(url: string) {
    invariant(
      typeof url === 'string',
      'Invalid url: should be a string'
    );
    IntentManager.openURL(url);
  }

  /**
   * Determine wether or not an installed app can handle a given `url`
   * The callback function will be called with `bool supported` as the only argument
   */
  static canOpenURL(url: string, callback: Function) {
    invariant(
      typeof url === 'string',
      'Invalid url: should be a string'
    );
    invariant(
      typeof callback === 'function',
      'A valid callback function is required'
    );
    IntentManager.canOpenURL(url, callback);
  }

}

module.exports = IntentAndroid;

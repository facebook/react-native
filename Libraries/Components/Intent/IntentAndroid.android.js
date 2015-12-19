/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule IntentAndroid
 */
'use strict';

var IntentAndroidModule = require('NativeModules').IntentAndroid;
var invariant = require('invariant');

/**
 * `IntentAndroid` gives you a general interface to handle external links.
 *
 * #### Opening external links
 *
 * To start the corresponding activity for a link (web URL, email, contact etc.), call
 *
 * ```
 * IntentAndroid.openURL(url)
 * ```
 *
 * If you want to check if any installed app can handle a given URL beforehand you can call
 * ```
 * IntentAndroid.canOpenURL(url, (supported) => {
 *   if (!supported) {
 *     console.log('Can\'t handle url: ' + url);
 *   } else {
 *     IntentAndroid.openURL(url);
 *   }
 * });
 * ```
 */
class IntentAndroid {

  /**
   * Starts a corresponding external activity for the given URL.
   *
   * For example, if the URL is "https://www.facebook.com", the system browser will be opened,
   * or the "choose application" dialog will be shown.
   *
   * You can use other URLs, like a location (e.g. "geo:37.484847,-122.148386"), a contact,
   * or any other URL that can be opened with {@code Intent.ACTION_VIEW}.
   *
   * NOTE: This method will fail if the system doesn't know how to open the specified URL.
   * If you're passing in a non-http(s) URL, it's best to check {@code canOpenURL} first.
   *
   * NOTE: For web URLs, the protocol ("http://", "https://") must be set accordingly!
   */
  static openURL(url: string) {
    this._validateURL(url);
    IntentAndroidModule.openURL(url);
  }

  /**
   * Determine whether or not an installed app can handle a given URL.
   *
   * You can use other URLs, like a location (e.g. "geo:37.484847,-122.148386"), a contact,
   * or any other URL that can be opened with {@code Intent.ACTION_VIEW}.
   *
   * NOTE: For web URLs, the protocol ("http://", "https://") must be set accordingly!
   *
   * @param URL the URL to open
   */
  static canOpenURL(url: string, callback: Function) {
    this._validateURL(url);
    invariant(
      typeof callback === 'function',
      'A valid callback function is required'
    );
    IntentAndroidModule.canOpenURL(url, callback);
  }

  static _validateURL(url: string) {
    invariant(
      typeof url === 'string',
      'Invalid URL: should be a string. Was: ' + url
    );
    invariant(
      url,
      'Invalid URL: cannot be empty'
    );
  }
}

module.exports = IntentAndroid;

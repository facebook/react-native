/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LocaleAndroid
 * @flow
 */
'use strict';

const NativeModules = require('NativeModules');

/**
 * <div class="banner-crna-ejected">
 *   <h3>Project with Native Code Required</h3>
 *   <p>
 *     This API only works in projects made with <code>react-native init</code>
 *     or in those made with Create React Native App which have since ejected. For
 *     more information about ejecting, please see
 *     the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on
 *     the Create React Native App repository.
 *   </p>
 * </div>
 *
 * As a browser polyfill, you can get the current device language using
 * `navigator.language` and `navigator.languages`.
 * 
 * This API is provided because Android doesn't reload your application after a
 * language change.
 *
 * Example usage:
 * ```
 * // Works on Android
 * AppState.addEventListener('change', (nextAppState) => {
 *   if (nextAppState === 'active') {
 *     LocaleAndroid.getAsync().then(locale => {
 *       alert(locale);
 *     );
 *   }
 * });
 * ```
 */
let LocaleAndroid = {
  getAsync(): Promise<string> {
    return NativeModules.Languages.getAsync();
  }
}

module.exports = LocaleAndroid;

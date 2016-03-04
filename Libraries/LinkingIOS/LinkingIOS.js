/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LinkingIOS
 * @flow
 */
'use strict';

var Linking = require('Linking');
var RCTLinkingManager = require('NativeModules').LinkingManager;
var invariant = require('fbjs/lib/invariant');

var _initialURL = RCTLinkingManager && RCTLinkingManager.initialURL;

/**
 * NOTE: `LinkingIOS` is being deprecated. Use `Linking` instead.
 *
 * `LinkingIOS` gives you a general interface to interact with both incoming
 * and outgoing app links.
 *
 * ### Basic Usage
 *
 * #### Handling deep links
 *
 * If your app was launched from an external url registered to your app you can
 * access and handle it from any component you want with
 *
 * ```
 * componentDidMount() {
 *  var url = LinkingIOS.popInitialURL();
 * }
 * ```
 *
 * In case you also want to listen to incoming app links during your app's
 * execution you'll need to add the following lines to you `*AppDelegate.m`:
 *
 * ```
 * - (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
 *   sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
 * {
 *   return [RCTLinkingManager application:application openURL:url
 *                       sourceApplication:sourceApplication annotation:annotation];
 * }
 *
 * // Only if your app is using [Universal Links](https://developer.apple.com/library/prerelease/ios/documentation/General/Conceptual/AppSearch/UniversalLinks.html).
 * - (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
 *  restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
 * {
 *  return [RCTLinkingManager application:application
 *                   continueUserActivity:userActivity
 *                     restorationHandler:restorationHandler];
 * }
 *
 * ```
 *
 * And then on your React component you'll be able to listen to the events on
 * `LinkingIOS` as follows
 *
 * ```
 * componentDidMount() {
 *   LinkingIOS.addEventListener('url', this._handleOpenURL);
 * },
 * componentWillUnmount() {
 *   LinkingIOS.removeEventListener('url', this._handleOpenURL);
 * },
 * _handleOpenURL(event) {
 *   console.log(event.url);
 * }
 * ```
 *
 * #### Triggering App links
 *
 * To trigger an app link (browser, email or custom schemas), call
 *
 * ```
 * LinkingIOS.openURL(url)
 * ```
 *
 * If you want to check if any installed app can handle a given URL beforehand, call
 * ```
 * LinkingIOS.canOpenURL(url, (supported) => {
 *   if (!supported) {
 *     AlertIOS.alert('Can\'t handle url: ' + url);
 *   } else {
 *     LinkingIOS.openURL(url);
 *   }
 * });
 * ```
 */
class LinkingIOS {
  /**
   * Add a handler to LinkingIOS changes by listening to the `url` event type
   * and providing the handler
   *
   * @deprecated
   */
  static addEventListener(type: string, handler: Function) {
    console.warn('"LinkingIOS.addEventListener" is deprecated. Use "Linking.addEventListener" instead.');
    Linking.addEventListener(type, handler);
  }

  /**
   * Remove a handler by passing the `url` event type and the handler
   *
   * @deprecated
   */
  static removeEventListener(type: string, handler: Function ) {
    console.warn('"LinkingIOS.removeEventListener" is deprecated. Use "Linking.removeEventListener" instead.');
    Linking.removeEventListener(type, handler);
  }

  /**
   * Try to open the given `url` with any of the installed apps.
   *
   * @deprecated
   */
  static openURL(url: string) {
    console.warn('"LinkingIOS.openURL" is deprecated. Use the promise based "Linking.openURL" instead.');
    Linking.openURL(url);
  }

  /**
   * Determine whether or not an installed app can handle a given URL.
   * The callback function will be called with `bool supported` as the only argument
   *
   * NOTE: As of iOS 9, your app needs to provide the `LSApplicationQueriesSchemes` key
   * inside `Info.plist`.
   *
   * @deprecated
   */
  static canOpenURL(url: string, callback: Function) {
    console.warn('"LinkingIOS.canOpenURL" is deprecated. Use the promise based "Linking.canOpenURL" instead.');
    invariant(
      typeof callback === 'function',
      'A valid callback function is required'
    );
    Linking.canOpenURL(url).then(callback);
  }

  /**
   * If the app launch was triggered by an app link, it will pop the link url,
   * otherwise it will return `null`
   *
   * @deprecated
   */
  static popInitialURL(): ?string {
    console.warn('"LinkingIOS.popInitialURL" is deprecated. Use the promise based "Linking.getInitialURL" instead.');
    var initialURL = _initialURL;
    _initialURL = null;
    return initialURL;
  }
}

module.exports = LinkingIOS;

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Linking
 * @flow
 */
'use strict';

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var Platform = require('Platform');

if (Platform.OS === 'android') {
  var RCTLinking = require('NativeModules').IntentAndroid;
} else {
  var RCTLinking = require('NativeModules').LinkingManager;
}

var Map = require('Map');
var invariant = require('invariant');

var _notifHandlers = new Map();
var _initialURL = RCTLinking.initialURL;

var DEVICE_NOTIF_EVENT = 'openURL';

/**
 * `Linking` gives you a general interface to interact with both incoming
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
 *  var url = Linking.popInitialURL();
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
 * `Linking` as follows
 *
 * ```
 * componentDidMount() {
 *   Linking.addEventListener('url', this._handleOpenURL);
 * },
 * componentWillUnmount() {
 *   Linking.removeEventListener('url', this._handleOpenURL);
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
 * Linking.openURL(url)
 * ```
 *
 * If you want to check if any installed app can handle a given URL beforehand, call
 * ```
 * Linking.canOpenURL(url, (supported) => {
 *   if (!supported) {
 *     AlertIOS.alert('Can\'t handle url: ' + url);
 *   } else {
 *     Linking.openURL(url);
 *   }
 * });
 * ```
 */
class Linking {
  /**
   * Add a handler to Linking changes by listening to the `url` event type
   * and providing the handler
   * @platform ios
   */
  static addEventListener(type: string, handler: Function) {
    invariant(
      type === 'url',
      'Linking only supports `url` events'
    );
    var listener = RCTDeviceEventEmitter.addListener(
      DEVICE_NOTIF_EVENT,
      handler
    );
    _notifHandlers.set(handler, listener);
  }

  /**
   * Remove a handler by passing the `url` event type and the handler
   * @platform ios
   */
  static removeEventListener(type: string, handler: Function ) {
    invariant(
      type === 'url',
      'Linking only supports `url` events'
    );
    var listener = _notifHandlers.get(handler);
    if (!listener) {
      return;
    }
    listener.remove();
    _notifHandlers.delete(handler);
  }

  /**
   * Try to open the given `url` with any of the installed apps.
   */
  static openURL(url: string) {
    this._validateURL(url);
    RCTLinking.openURL(url);
  }

  /**
   * Determine whether or not an installed app can handle a given URL.
   * The callback function will be called with `bool supported` as the only argument
   *
   * NOTE: As of iOS 9, your app needs to provide the `LSApplicationQueriesSchemes` key
   * inside `Info.plist`.
   *
   * @param URL the URL to open
   */
  static canOpenURL(url: string, callback: Function) {
    this._validateURL(url);
    invariant(
      typeof callback === 'function',
      'A valid callback function is required'
    );
    RCTLinking.canOpenURL(url, callback);
  }

  /**
   * If the app launch was triggered by an app link, it will pop the link url,
   * otherwise it will return `null`
   * On Android, Refer http://developer.android.com/training/app-indexing/deep-linking.html#handling-intents
   */
  static popInitialURL(): ?string {
    var initialURL = _initialURL;
    _initialURL = null;
    return initialURL;
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

module.exports = Linking;

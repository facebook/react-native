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

const Platform = require('Platform');
const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
const {
  IntentAndroid,
  LinkingManager: LinkingManagerIOS
} = require('NativeModules');
const LinkingManager = Platform.OS === 'android' ? IntentAndroid : LinkingManagerIOS;
const invariant = require('invariant');
const Map = require('Map');

const _notifHandlers = new Map();

const DEVICE_NOTIF_EVENT = 'openURL';

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
 *   var url = Linking.getInitialURL().then(url) => {
 *     if (url) {
 *       console.log('Initial url is: ' + url);
 *     }
 *   }).catch(err => console.error('An error occurred', err));
 * }
 * ```
 *
 * NOTE: For instructions on how to add support for deep linking on Android,
 * refer [Enabling Deep Links for App Content - Add Intent Filters for Your Deep Links](http://developer.android.com/training/app-indexing/deep-linking.html#adding-filters).
 *
 * NOTE: For iOS, in case you also want to listen to incoming app links during your app's
 * execution you'll need to add the following lines to you `*AppDelegate.m`:
 *
 * ```
 * - (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
 *   sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
 * {
 *   return [LinkingManager application:application openURL:url
 *                       sourceApplication:sourceApplication annotation:annotation];
 * }
 *
 * // Only if your app is using [Universal Links](https://developer.apple.com/library/prerelease/ios/documentation/General/Conceptual/AppSearch/UniversalLinks.html).
 * - (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
 *  restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
 * {
 *  return [LinkingManager application:application
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
 * Note that this is only supported on iOS.
 *
 * #### Opening external links
 *
 * To start the corresponding activity for a link (web URL, email, contact etc.), call
 *
 * ```
 * Linking.openURL(url).catch(err => console.error('An error occurred', err));
 * ```
 *
 * If you want to check if any installed app can handle a given URL beforehand you can call
 * ```
 * Linking.canOpenURL(url).then(supported => {
 *   if (!supported) {
 *     console.log('Can\'t handle url: ' + url);
 *   } else {
 *     return Linking.openURL(url);
 *   }
 * }).catch(err => console.error('An error occurred', err));
 * ```
 */
class Linking {
  /**
   * Add a handler to Linking changes by listening to the `url` event type
   * and providing the handler
   *
   * @platform ios
   */
  static addEventListener(type: string, handler: Function) {
    if (Platform.OS === 'android') {
        console.warn('Linking.addEventListener is not supported on Android');
    } else {
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
  }

  /**
   * Remove a handler by passing the `url` event type and the handler
   *
   * @platform ios
   */
  static removeEventListener(type: string, handler: Function ) {
    if (Platform.OS === 'android') {
        console.warn('Linking.removeEventListener is not supported on Android');
    } else {
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
  }

  /**
   * Try to open the given `url` with any of the installed apps.
   *
   * You can use other URLs, like a location (e.g. "geo:37.484847,-122.148386"), a contact,
   * or any other URL that can be opened with the installed apps.
   *
   * NOTE: This method will fail if the system doesn't know how to open the specified URL.
   * If you're passing in a non-http(s) URL, it's best to check {@code canOpenURL} first.
   *
   * NOTE: For web URLs, the protocol ("http://", "https://") must be set accordingly!
   */
  static openURL(url: string): Promise<boolean> {
    this._validateURL(url);
    return LinkingManager.openURL(url);
  }

  /**
   * Determine whether or not an installed app can handle a given URL.
   *
   * NOTE: For web URLs, the protocol ("http://", "https://") must be set accordingly!
   *
   * NOTE: As of iOS 9, your app needs to provide the `LSApplicationQueriesSchemes` key
   * inside `Info.plist`.
   *
   * @param URL the URL to open
   */
  static canOpenURL(url: string): Promise<boolean> {
    this._validateURL(url);
    return LinkingManager.canOpenURL(url);
  }

  /**
   * If the app launch was triggered by an app link with,
   * it will give the link url, otherwise it will give `null`
   *
   * NOTE: To support deep linking on Android, refer http://developer.android.com/training/app-indexing/deep-linking.html#handling-intents
   */
  static getInitialURL(): Promise<?string> {
    if (Platform.OS === 'android') {
      return IntentAndroid.getInitialURL();
    } else {
      return Promise.resolve(LinkingManagerIOS.initialURL);
    }
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

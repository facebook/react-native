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

const NativeEventEmitter = require('NativeEventEmitter');
const NativeModules = require('NativeModules');
const Platform = require('Platform');

const invariant = require('fbjs/lib/invariant');

const LinkingManager = Platform.OS === 'android' ?
  NativeModules.IntentAndroid : NativeModules.LinkingManager;

/**
 * <div class="banner-crna-ejected">
 *   <h3>Projects with Native Code Only</h3>
 *   <p>
 *     This section only applies to projects made with <code>react-native init</code>
 *     or to those made with Create React Native App which have since ejected. For
 *     more information about ejecting, please see
 *     the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on
 *     the Create React Native App repository.
 *   </p>
 * </div>
 *
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
 *   Linking.getInitialURL().then((url) => {
 *     if (url) {
 *       console.log('Initial url is: ' + url);
 *     }
 *   }).catch(err => console.error('An error occurred', err));
 * }
 * ```
 *
 * NOTE: For instructions on how to add support for deep linking on Android,
 * refer to [Enabling Deep Links for App Content - Add Intent Filters for Your Deep Links](http://developer.android.com/training/app-indexing/deep-linking.html#adding-filters).
 *
 * If you wish to receive the intent in an existing instance of MainActivity,
 * you may set the `launchMode` of MainActivity to `singleTask` in
 * `AndroidManifest.xml`. See [`<activity>`](http://developer.android.com/guide/topics/manifest/activity-element.html)
 * documentation for more information.
 *
 * ```
 * <activity
 *   android:name=".MainActivity"
 *   android:launchMode="singleTask">
 * ```
 *
 * NOTE: On iOS, you'll need to link `RCTLinking` to your project by following
 * the steps described [here](docs/linking-libraries-ios.html#manual-linking).
 * If you also want to listen to incoming app links during your app's
 * execution, you'll need to add the following lines to your `*AppDelegate.m`:
 *
 * ```
 * // iOS 9.x or newer
 * #import <React/RCTLinkingManager.h>
 *
 * - (BOOL)application:(UIApplication *)application
 *    openURL:(NSURL *)url
 *    options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
 * {
 *   return [RCTLinkingManager application:application openURL:url options:options];
 * }
 * ```
 * 
 * If you're targeting iOS 8.x or older, you can use the following code instead:
 *
 * ```
 * // iOS 8.x or older
 * #import <React/RCTLinkingManager.h>
 *
 * - (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
 *   sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
 * {
 *   return [RCTLinkingManager application:application openURL:url
 *                       sourceApplication:sourceApplication annotation:annotation];
 * }
 * ```
 *
 *
 * // If your app is using [Universal Links](https://developer.apple.com/library/prerelease/ios/documentation/General/Conceptual/AppSearch/UniversalLinks.html),
 * you'll need to add the following code as well:
 *
 * ```
 * - (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
 *  restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
 * {
 *  return [RCTLinkingManager application:application
 *                   continueUserActivity:userActivity
 *                     restorationHandler:restorationHandler];
 * }
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
class Linking extends NativeEventEmitter {

  constructor() {
    super(LinkingManager);
  }

  /**
   * Add a handler to Linking changes by listening to the `url` event type
   * and providing the handler
   */
  addEventListener(type: string, handler: Function) {
    this.addListener(type, handler);
  }

  /**
   * Remove a handler by passing the `url` event type and the handler
   */
  removeEventListener(type: string, handler: Function ) {
    this.removeListener(type, handler);
  }

  /**
   * Try to open the given `url` with any of the installed apps.
   *
   * You can use other URLs, like a location (e.g. "geo:37.484847,-122.148386" on Android
   * or "http://maps.apple.com/?ll=37.484847,-122.148386" on iOS), a contact,
   * or any other URL that can be opened with the installed apps.
   *
   * The method returns a `Promise` object. If the user confirms the open dialog or the
   * url automatically opens, the promise is resolved.  If the user cancels the open dialog
   * or there are no registered applications for the url, the promise is rejected.
   *
   * NOTE: This method will fail if the system doesn't know how to open the specified URL.
   * If you're passing in a non-http(s) URL, it's best to check {@code canOpenURL} first.
   *
   * NOTE: For web URLs, the protocol ("http://", "https://") must be set accordingly!
   */
  openURL(url: string): Promise<any> {
    this._validateURL(url);
    return LinkingManager.openURL(url);
  }

  /**
   * Determine whether or not an installed app can handle a given URL.
   *
   * NOTE: For web URLs, the protocol ("http://", "https://") must be set accordingly!
   *
   * NOTE: As of iOS 9, your app needs to provide the `LSApplicationQueriesSchemes` key
   * inside `Info.plist` or canOpenURL will always return false.
   *
   * @param URL the URL to open
   */
  canOpenURL(url: string): Promise<boolean> {
    this._validateURL(url);
    return LinkingManager.canOpenURL(url);
  }

  /**
   * If the app launch was triggered by an app link,
   * it will give the link url, otherwise it will give `null`
   *
   * NOTE: To support deep linking on Android, refer http://developer.android.com/training/app-indexing/deep-linking.html#handling-intents
   */
  getInitialURL(): Promise<?string> {
    return LinkingManager.getInitialURL();
  }

  _validateURL(url: string) {
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

module.exports = new Linking();

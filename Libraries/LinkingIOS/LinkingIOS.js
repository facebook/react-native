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

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTLinkingManager = require('NativeModules').LinkingManager;
var Map = require('Map');
var invariant = require('invariant');

var _notifHandlers = new Map();
var _initialURL = RCTLinkingManager &&
  RCTLinkingManager.initialURL;

var DEVICE_NOTIF_EVENT = 'openURL';

/**
 * `LinkingIOS` gives you a general interface to interact with both, incoming
 * and outgoing app links.
 *
 * ### Basic Usage
 *
 * #### Handling deep links
 *
 * If your app was launched from a external url registered to your app you can
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
 * - (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation {
 *   return [RCTLinkingManager application:application openURL:url sourceApplication:sourceApplication annotation:annotation];
 * }
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
 * To trigger an app link (browser, email or custom schemas) you call
 *
 * ```
 * LinkingIOS.openURL(url)
 * ```
 *
 * If you want to check if any installed app can handle a given url beforehand you can call
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
   */
  static addEventListener(type: string, handler: Function) {
    invariant(
      type === 'url',
      'LinkingIOS only supports `url` events'
    );
    var listener = RCTDeviceEventEmitter.addListener(
      DEVICE_NOTIF_EVENT,
      handler
    );
    _notifHandlers.set(handler, listener);
  }

  /**
   * Remove a handler by passing the `url` event type and the handler
   */
  static removeEventListener(type: string, handler: Function ) {
    invariant(
      type === 'url',
      'LinkingIOS only supports `url` events'
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
    invariant(
      typeof url === 'string',
      'Invalid url: should be a string'
    );
    RCTLinkingManager.openURL(url);
  }

  /**
   * Determine wether or not the an installed app can handle a given `url`
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
    RCTLinkingManager.canOpenURL(url, callback);
  }

  /**
   * If the app launch was triggered by an app link, it will pop the link url,
   * otherwise it will return `null`
   */
  static popInitialURL(): ?string {
    var initialURL = _initialURL;
    _initialURL = null;
    return initialURL;
  }
}

module.exports = LinkingIOS;

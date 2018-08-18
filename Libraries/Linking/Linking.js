/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const NativeEventEmitter = require('NativeEventEmitter');
const NativeModules = require('NativeModules');
const Platform = require('Platform');

const invariant = require('fbjs/lib/invariant');

const LinkingManager =
  Platform.OS === 'android'
    ? NativeModules.IntentAndroid
    : NativeModules.LinkingManager;

/**
 * `Linking` gives you a general interface to interact with both incoming
 * and outgoing app links.
 *
 * See https://facebook.github.io/react-native/docs/linking.html
 */
class Linking extends NativeEventEmitter {
  constructor() {
    super(LinkingManager);
  }

  /**
   * Add a handler to Linking changes by listening to the `url` event type
   * and providing the handler
   *
   * See https://facebook.github.io/react-native/docs/linking.html#addeventlistener
   */
  addEventListener(type: string, handler: Function) {
    this.addListener(type, handler);
  }

  /**
   * Remove a handler by passing the `url` event type and the handler.
   *
   * See https://facebook.github.io/react-native/docs/linking.html#removeeventlistener
   */
  removeEventListener(type: string, handler: Function) {
    this.removeListener(type, handler);
  }

  /**
   * Try to open the given `url` with any of the installed apps.
   *
   * See https://facebook.github.io/react-native/docs/linking.html#openurl
   */
  openURL(url: string): Promise<any> {
    this._validateURL(url);
    return LinkingManager.openURL(url);
  }

  /**
   * Determine whether or not an installed app can handle a given URL.
   *
   * See https://facebook.github.io/react-native/docs/linking.html#canopenurl
   */
  canOpenURL(url: string): Promise<boolean> {
    this._validateURL(url);
    return LinkingManager.canOpenURL(url);
  }

  /**
   * If the app launch was triggered by an app link,
   * it will give the link url, otherwise it will give `null`
   *
   * See https://facebook.github.io/react-native/docs/linking.html#getinitialurl
   */
  getInitialURL(): Promise<?string> {
    return LinkingManager.getInitialURL();
  }

  _validateURL(url: string) {
    invariant(
      typeof url === 'string',
      'Invalid URL: should be a string. Was: ' + url,
    );
    invariant(url, 'Invalid URL: cannot be empty');
  }
}

module.exports = new Linking();

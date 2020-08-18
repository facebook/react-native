/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const InteractionManager = require('../Interaction/InteractionManager');
const NativeEventEmitter = require('../EventEmitter/NativeEventEmitter');
const Platform = require('../Utilities/Platform');

const invariant = require('invariant');

import NativeLinking from './NativeLinking';

/**
 * `Linking` gives you a general interface to interact with both incoming
 * and outgoing app links.
 *
 * See https://facebook.github.io/react-native/docs/linking.html
 */
class Linking extends NativeEventEmitter {
  constructor() {
    super(NativeLinking);
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
    return NativeLinking.openURL(url);
  }

  /**
   * Determine whether or not an installed app can handle a given URL.
   *
   * See https://facebook.github.io/react-native/docs/linking.html#canopenurl
   */
  canOpenURL(url: string): Promise<boolean> {
    this._validateURL(url);
    return NativeLinking.canOpenURL(url);
  }

  /**
   * Open app settings.
   *
   * See https://facebook.github.io/react-native/docs/linking.html#opensettings
   */
  openSettings(): Promise<any> {
    return NativeLinking.openSettings();
  }

  /**
   * If the app launch was triggered by an app link,
   * it will give the link url, otherwise it will give `null`
   *
   * See https://facebook.github.io/react-native/docs/linking.html#getinitialurl
   */
  getInitialURL(): Promise<?string> {
    return Platform.OS === 'android'
      ? InteractionManager.runAfterInteractions().then(() =>
          NativeLinking.getInitialURL(),
        )
      : NativeLinking.getInitialURL();
  }

  /*
   * Launch an Android intent with extras (optional)
   *
   * @platform android
   *
   * See https://facebook.github.io/react-native/docs/linking.html#sendintent
   */
  sendIntent(
    action: string,
    extras?: Array<{
      key: string,
      value: string | number | boolean,
      ...
    }>,
  ): Promise<void> {
    if (Platform.OS === 'android') {
      return NativeLinking.sendIntent(action, extras);
    }
    return new Promise((resolve, reject) => reject(new Error('Unsupported')));
  }

  _validateURL(url: string) {
    invariant(
      typeof url === 'string',
      'Invalid URL: should be a string. Was: ' + url,
    );
    invariant(url, 'Invalid URL: cannot be empty');
  }
}

module.exports = (new Linking(): Linking);

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import {type EventSubscription} from '../vendor/emitter/EventEmitter';
import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import InteractionManager from '../Interaction/InteractionManager';
import Platform from '../Utilities/Platform';
import NativeLinkingManager from './NativeLinkingManager';
import NativeIntentAndroid from './NativeIntentAndroid';
import invariant from 'invariant';
import nullthrows from 'nullthrows';

type LinkingEventDefinitions = {
  url: [{url: string}],
};

/**
 * `Linking` gives you a general interface to interact with both incoming
 * and outgoing app links.
 *
 * See https://reactnative.dev/docs/linking
 */
class Linking extends NativeEventEmitter<LinkingEventDefinitions> {
  constructor() {
    super(Platform.OS === 'ios' ? nullthrows(NativeLinkingManager) : undefined);
  }

  /**
   * Add a handler to Linking changes by listening to the `url` event type
   * and providing the handler
   *
   * See https://reactnative.dev/docs/linking#addeventlistener
   */
  addEventListener<K: $Keys<LinkingEventDefinitions>>(
    eventType: K,
    listener: (...$ElementType<LinkingEventDefinitions, K>) => mixed,
    context: $FlowFixMe,
  ): EventSubscription {
    return this.addListener(eventType, listener);
  }

  /**
   * @deprecated Use `remove` on the EventSubscription from `addEventListener`.
   */
  removeEventListener<K: $Keys<LinkingEventDefinitions>>(
    eventType: K,
    listener: (...$ElementType<LinkingEventDefinitions, K>) => mixed,
  ): void {
    // NOTE: This will report a deprecation notice via `console.error`.
    this.removeListener(eventType, listener);
  }

  /**
   * Try to open the given `url` with any of the installed apps.
   *
   * See https://reactnative.dev/docs/linking#openurl
   */
  openURL(url: string): Promise<void> {
    this._validateURL(url);
    if (Platform.OS === 'android') {
      return nullthrows(NativeIntentAndroid).openURL(url);
    } else {
      return nullthrows(NativeLinkingManager).openURL(url);
    }
  }

  /**
   * Determine whether or not an installed app can handle a given URL.
   *
   * See https://reactnative.dev/docs/linking#canopenurl
   */
  canOpenURL(url: string): Promise<boolean> {
    this._validateURL(url);
    if (Platform.OS === 'android') {
      return nullthrows(NativeIntentAndroid).canOpenURL(url);
    } else {
      return nullthrows(NativeLinkingManager).canOpenURL(url);
    }
  }

  /**
   * Open app settings.
   *
   * See https://reactnative.dev/docs/linking#opensettings
   */
  openSettings(): Promise<void> {
    if (Platform.OS === 'android') {
      return nullthrows(NativeIntentAndroid).openSettings();
    } else {
      return nullthrows(NativeLinkingManager).openSettings();
    }
  }

  /**
   * If the app launch was triggered by an app link,
   * it will give the link url, otherwise it will give `null`
   *
   * See https://reactnative.dev/docs/linking#getinitialurl
   */
  getInitialURL(): Promise<?string> {
    return Platform.OS === 'android'
      ? InteractionManager.runAfterInteractions().then(() =>
          nullthrows(NativeIntentAndroid).getInitialURL(),
        )
      : nullthrows(NativeLinkingManager).getInitialURL();
  }

  /*
   * Launch an Android intent with extras (optional)
   *
   * @platform android
   *
   * See https://reactnative.dev/docs/linking#sendintent
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
      return nullthrows(NativeIntentAndroid).sendIntent(action, extras);
    } else {
      return new Promise((resolve, reject) => reject(new Error('Unsupported')));
    }
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

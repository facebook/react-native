/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LanguagesAndroid
 * @flow
 */
'use strict';

const NativeEventEmitter = require('NativeEventEmitter');
const Languages = require('NativeModules').Languages;
const LanguagesEventEmitter = new NativeEventEmitter(Languages);

const invariant = require('fbjs/lib/invariant');

type LanguagesEventType = 'languagesDidChange';

type LanguagesEventData = {
  language: string,
  languages: Array<string>,
};

type LanguagesEventHandler = () => void;

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
 * `navigator.language` and `navigator.languages` on iOS and android.
 *
 * This API is provided only because Android doesn't reload your application
 * after a device language change.
 *
 * ### Usage
 * 
 * ```
 * LanguagesAndroid.addEventListener('change', () => {
 *   alert(navigator.language);
 * });
 * ```
 */

class LanguagesAndroid {

  _eventHandlers: Set<LanguagesEventHandler>;

  constructor() {
    this._eventHandlers = new Set();

    LanguagesEventEmitter.addListener(
      'languagesDidChange',
      (eventData: LanguagesEventData) => {
        navigator.language = eventData.language;
        navigator.languages = eventData.languages;

        this._eventHandlers.forEach(handler => {
          handler();
        });
      }
    );
  }

  /**
   * Add a handler to LanguagesAndroid changes by listening to the `change` event
   * type and providing the handler.
   *
   * @param {string} type The `event` is the string that identifies the event you're listening for.  The
   * only one available is `change`.
   *
   * @param {function} handler function to be called when the event fires.
   */
  addEventListener(
    type: LanguagesEventType,
    handler: LanguagesEventHandler
  ) {
    invariant(
      type === 'change',
      'Trying to subscribe to unknown event: "%s"', type
    );
    if (type === 'change') {
      this._eventHandlers.add(handler);
    }
  }

  /**
   * Remove a handler by passing the `change` event type and the handler.
   *
   * @param {string} type The `event` is the string that identifies the event you're listening for.
   * @param {function} handler function to be called when the event fires.
   */
  removeEventListener(
    type: LanguagesEventType,
    handler: LanguagesEventHandler
  ) {
    invariant(
      type === 'change',
      'Trying to remove listener for unknown event: "%s"', type
    );
    if (type === 'change' && this._eventHandlers.has(handler)) {
      this._eventHandlers.delete(handler);
    }
  }
}

module.exports = new LanguagesAndroid();

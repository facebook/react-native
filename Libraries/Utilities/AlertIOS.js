/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AlertIOS
 * @flow
 */
'use strict';

var RCTAlertManager = require('NativeModules').AlertManager;
var invariant = require('invariant');

var DEFAULT_BUTTON_TEXT = 'OK';
var DEFAULT_BUTTON = {
  text: DEFAULT_BUTTON_TEXT,
  onPress: null,
};

/**
 * Launches an alert dialog with the specified title and message.
 *
 * Optionally provide a list of buttons. Tapping any button will fire the
 * respective onPress callback and dismiss the alert. By default, the only
 * button will be an 'OK' button
 *
 * The last button in the list will be considered the 'Primary' button and
 * it will appear bold.
 *
 * ```
 * AlertIOS.alert(
 *   'Foo Title',
 *   'My Alert Msg',
 *   [
 *     {text: 'Foo', onPress: () => console.log('Foo Pressed!')},
 *     {text: 'Bar', onPress: () => console.log('Bar Pressed!')},
 *   ]
 * )
 * ```
 */

class AlertIOS {
  static alert(
    title: ?string,
    message?: ?string,
    buttons?: Array<{
      text: ?string;
      onPress?: ?Function;
    }>,
    type?: ?string
  ): void {
    var callbacks = [];
    var buttonsSpec = [];
    title = title || '';
    message = message || '';
    buttons = buttons || [DEFAULT_BUTTON];
    type = type || '';

    buttons.forEach((btn, index) => {
      callbacks[index] = btn.onPress;
      var btnDef = {};
      btnDef[index] = btn.text || DEFAULT_BUTTON_TEXT;
      buttonsSpec.push(btnDef);
    });
    RCTAlertManager.alertWithArgs({
      title,
      message,
      buttons: buttonsSpec,
      type,
    }, (id, value) => {
      var cb = callbacks[id];
      cb && cb(value);
    });
  }

  static prompt(
    title: string,
    value?: string,
    buttons?: Array<{
      text: ?string;
      onPress?: ?Function;
    }>,
    callback?: ?Function
  ): void {
    if (arguments.length === 2) {
      if (typeof value === 'object') {
        buttons = value;
        value = undefined;
      } else if (typeof value === 'function') {
        callback = value;
        value = undefined;
      }
    } else if (arguments.length === 3 && typeof buttons === 'function') {
      callback = buttons;
      buttons = undefined;
    }

    invariant(
      !(callback && buttons) && (callback || buttons),
      'Must provide either a button list or a callback, but not both'
    );

    if (!buttons) {
      buttons = [{
        text: 'Cancel',
      }, {
        text: 'OK',
        onPress: callback
      }];
    }
    this.alert(title, value, buttons, 'plain-text');
  }
}

module.exports = AlertIOS;

/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule AlertIOS
 * @flow
 */
'use strict';

var NativeModules = require('NativeModulesDeprecated');

var RCTAlertManager = NativeModules.RCTAlertManager;

var DEFAULT_BUTTON_TEXT = 'OK';
var DEFAULT_BUTTON = {
  text: DEFAULT_BUTTON_TEXT,
  onPress: null,
};

/**
 * AlertIOS manages native iOS alerts, option sheets, and share dialogs
 */

class AlertIOS {

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
   * )}
   * ```
   */
  static alert(
    title: ?string,
    message: ?string,
    buttons: ?Array<{
      text: ?string;
      onPress: ?Function;
    }>
  ): void {
    var callbacks = [];
    var buttonsSpec = [];
    title = title || '';
    message = message || '';
    buttons = buttons || [DEFAULT_BUTTON];
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
    }, (id) => {
      var cb = callbacks[id];
      cb && cb();
    });
  }

}

module.exports = AlertIOS;

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Alert
 * @flow
 */
'use strict';

var AlertIOS = require('AlertIOS');
var Platform = require('Platform');
var DialogModuleAndroid = require('NativeModules').DialogManagerAndroid;

import type { AlertType, AlertButtonStyle } from 'AlertIOS';

type Buttons = Array<{
  text?: string;
  onPress?: ?Function;
  style?: AlertButtonStyle;
}>;

/**
 * Launches an alert dialog with the specified title and message.
 *
 * Optionally provide a list of buttons. Tapping any button will fire the
 * respective onPress callback and dismiss the alert. By default, the only
 * button will be an 'OK' button.
 *
 * This is an API that works both on iOS and Android and can show static
 * alerts. To show an alert that prompts the user to enter some information,
 * see `AlertIOS`; entering text in an alert is common on iOS only.
 *
 * ## iOS
 *
 * On iOS you can specify any number of buttons. Each button can optionally
 * specify a style and you can also specify type of the alert. Refer to
 * `AlertIOS` for details.
 *
 * ## Android
 * 
 * On Android at most three buttons can be specified. Android has a concept
 * of a neutral, negative and a positive button:
 *
 *   - If you specify one button, it will be the 'positive' one (such as 'OK')
 *   - Two buttons mean 'negative', 'positive' (such as 'Cancel', 'OK')
 *   - Three buttons mean 'neutral', 'negative', 'positive' (such as 'Later', 'Cancel', 'OK')
 *
 * ```
 * // Works on both iOS and Android
 * Alert.alert(
 *   'Alert Title',
 *   'My Alert Msg',
 *   [
 *     {text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},
 *     {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
 *     {text: 'OK', onPress: () => console.log('OK Pressed')},
 *   ]
 * )
 * ```
 */
class Alert {

  static alert(
    title: ?string,
    message?: ?string,
    buttons?: Buttons,
    type?: AlertType
  ): void {
    if (Platform.OS === 'ios') {
      AlertIOS.alert(title, message, buttons, type);
    } else if (Platform.OS === 'android') {
      AlertAndroid.alert(title, message, buttons);
    }
  }
}

/**
 * Wrapper around the Android native module.
 */
class AlertAndroid {

  static alert(
    title: ?string,
    message?: ?string,
    buttons?: Buttons,
  ): void {
    var config = {
      title: title || '',
      message: message || '',
    };
    // At most three buttons (neutral, negative, positive). Ignore rest.
    // The text 'OK' should be probably localized. iOS Alert does that in native.
    var validButtons: Buttons = buttons ? buttons.slice(0, 3) : [{text: 'OK'}];
    var buttonPositive = validButtons.pop();
    var buttonNegative = validButtons.pop();
    var buttonNeutral = validButtons.pop();
    if (buttonNeutral) {
      config = {...config, buttonNeutral: buttonNeutral.text || '' }
    }
    if (buttonNegative) {
      config = {...config, buttonNegative: buttonNegative.text || '' }
    }
    if (buttonPositive) {
      config = {...config, buttonPositive: buttonPositive.text || '' }
    }
    DialogModuleAndroid.showAlert(
      config,
      (errorMessage) => console.warn(message),
      (action, buttonKey) => {
        if (action !== DialogModuleAndroid.buttonClicked) {
          return;
        }
        if (buttonKey === DialogModuleAndroid.buttonNeutral) {
          buttonNeutral.onPress && buttonNeutral.onPress();
        } else if (buttonKey === DialogModuleAndroid.buttonNegative) {
          buttonNegative.onPress && buttonNegative.onPress();
        } else if (buttonKey === DialogModuleAndroid.buttonPositive) {
          buttonPositive.onPress && buttonPositive.onPress();
        }
      }
    );
  }
}

module.exports = Alert;

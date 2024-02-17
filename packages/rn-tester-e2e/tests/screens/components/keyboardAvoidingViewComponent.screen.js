/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {
  UtilsSingleton as Utils,
  androidWidget,
  iOSLabel,
  iOSName,
} from '../../helpers/utils';

type KeyboardAvoidingViewComponentScreenType = {
  keyboardAvoidingViewScreenElement: string,
  btnDifferentBehaviorsOpenExampleElement: string,
  btnRegisterElement: string,
  registerAlertBoxElement: string,
  btnOKElement: string,
  scrollUntilKeyboardAvoidingViewComponentIsDisplayed: () => Promise<void>,
  checkBtnDifferentBehaviorsOpenExampleIsDisplayed: () => Promise<boolean>,
  checkBtnRegisterIsDisplayed: () => Promise<boolean>,
  clickDifferentBehaviorsOpenExampleButton: () => Promise<void>,
  clickRegisterButton: () => Promise<void>,
  clickOkButton: () => Promise<void>,
  getRegisterAlertText: () => Promise<string>,
};

export const KeyboardAvoidingViewComponentScreen: KeyboardAvoidingViewComponentScreenType =
  {
    // reference in the Components list
    keyboardAvoidingViewScreenElement: Utils.platformSelect({
      ios: iOSName('KeyboardAvoidingView'),
      android: androidWidget('TextView', 'text', 'KeyboardAvoidingView'),
    }),
    // References to elements within the KeyboardAvoidingVIew Component screen
    btnDifferentBehaviorsOpenExampleElement: Utils.platformSelect({
      ios: iOSName('keyboard_avoiding_view_behaviors_open'),
      android: androidWidget(
        'TextView',
        'resource-id',
        'keyboard_avoiding_view_behaviors_open',
      ),
    }),
    btnRegisterElement: Utils.platformSelect({
      ios: iOSName('register_button'),
      android: androidWidget('Button', 'resource-id', 'register_button'),
    }),
    registerAlertBoxElement: Utils.platformSelect({
      ios: iOSLabel('Successfully Registered!'),
      android: androidWidget(
        'TextView',
        'resource-id',
        'android:id/alertTitle',
      ),
    }),
    btnOKElement: Utils.platformSelect({
      ios: iOSLabel('OK'),
      android: androidWidget('Button', 'text', 'OK'),
    }),
    // Methods to interact with the elements
    scrollUntilKeyboardAvoidingViewComponentIsDisplayed: async function (
      this: KeyboardAvoidingViewComponentScreenType,
    ): Promise<void> {
      return await Utils.scrollToElement(
        this.keyboardAvoidingViewScreenElement,
      );
    },
    checkBtnDifferentBehaviorsOpenExampleIsDisplayed: async function (
      this: KeyboardAvoidingViewComponentScreenType,
    ): Promise<boolean> {
      return await Utils.checkElementExistence(
        this.btnDifferentBehaviorsOpenExampleElement,
      );
    },
    checkBtnRegisterIsDisplayed: async function (
      this: KeyboardAvoidingViewComponentScreenType,
    ): Promise<boolean> {
      return await Utils.checkElementExistence(this.btnRegisterElement);
    },
    clickDifferentBehaviorsOpenExampleButton: async function (
      this: KeyboardAvoidingViewComponentScreenType,
    ): Promise<void> {
      await Utils.clickElement(this.btnDifferentBehaviorsOpenExampleElement);
    },
    clickRegisterButton: async function (
      this: KeyboardAvoidingViewComponentScreenType,
    ): Promise<void> {
      await Utils.clickElement(this.btnRegisterElement);
    },
    clickOkButton: async function (
      this: KeyboardAvoidingViewComponentScreenType,
    ): Promise<void> {
      await Utils.clickElement(this.btnOKElement);
    },
    getRegisterAlertText: async function (
      this: KeyboardAvoidingViewComponentScreenType,
    ): Promise<string> {
      return await Utils.getElementText(this.registerAlertBoxElement);
    },
  };

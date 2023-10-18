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
  iOSLabel,
  androidWidget,
} from '../../helpers/utils';

type ButtonComponentScreenType = {
  buttonScreenElement: string,
  btnSubmitElement: string,
  inputSearchElement: string,
  btnOKElement: string,
  btnCancelElement: string,
  submitAlertBoxElement: string,
  cancelAlertBoxElement: string,
  checkButtonsScreenIsDisplayed: () => Promise<string>,
  clickSubmitApplication: () => Promise<void>,
  clickCancelApplication: () => Promise<void>,
  getCancelAlertText: () => Promise<string>,
  getSubmitAlertText: () => Promise<string>,
  clickOkButton: () => Promise<void>,
};

export const ButtonComponentScreen: ButtonComponentScreenType = {
  // reference in the Components list
  buttonScreenElement: Utils.platformSelect({
    ios: iOSLabel('Button'),
    android: androidWidget('ViewGroup', 'text', 'Button'),
  }),
  // References to elements within the Button Component screen
  btnSubmitElement: Utils.platformSelect({
    ios: iOSLabel('Press to submit your application!'),
    android: androidWidget('Button', 'resource-id', 'button_default_styling'),
  }),
  inputSearchElement: Utils.platformSelect({
    ios: iOSLabel('example_search'),
    android: androidWidget('EditText', 'resource-id', 'example_search'),
  }),
  btnOKElement: Utils.platformSelect({
    ios: iOSLabel('OK'),
    android: androidWidget('Button', 'text', 'OK'),
  }),
  btnCancelElement: Utils.platformSelect({
    ios: iOSLabel('Press to cancel your application!'),
    android: androidWidget('Button', 'resource-id', 'cancel_button'),
  }),
  submitAlertBoxElement: Utils.platformSelect({
    ios: iOSLabel('Your application has been submitted!'),
    android: androidWidget('TextView', 'resource-id', 'android:id/alertTitle'),
  }),
  cancelAlertBoxElement: Utils.platformSelect({
    ios: iOSLabel('Your application has been cancelled!'),
    android: androidWidget('TextView', 'resource-id', 'android:id/alertTitle'),
  }),
  // Methods to interact with the elements
  checkButtonsScreenIsDisplayed: async function (
    this: ButtonComponentScreenType,
  ): Promise<string> {
    return await Utils.getElementText(this.buttonScreenElement);
  },
  clickSubmitApplication: async function (
    this: ButtonComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.btnSubmitElement);
  },
  clickCancelApplication: async function (
    this: ButtonComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.btnCancelElement);
  },
  getCancelAlertText: async function (
    this: ButtonComponentScreenType,
  ): Promise<string> {
    return await Utils.getElementText(this.cancelAlertBoxElement);
  },
  getSubmitAlertText: async function (
    this: ButtonComponentScreenType,
  ): Promise<string> {
    return await Utils.getElementText(this.submitAlertBoxElement);
  },
  clickOkButton: async function (
    this: ButtonComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.btnOKElement);
  },
};

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import Utils from '../helpers/utils';

class ButtonComponentScreen {
  buttonScreenElement = Utils.platformSelect({
    ios: '[label="Button"]',
    android: '//android.view.ViewGroup/android.widget.TextView[@text="Button"]',
  });

  btnSubmitElement = Utils.platformSelect({
    ios: '[label="Press to submit your application!"]',
    android: '//android.widget.Button[@resource-id="button_default_styling"]',
  });

  inputSearchElement = Utils.platformSelect({
    ios: '[name="example_search"]',
    android: '//android.widget.EditText[@resource-id="example_search"]',
  });

  btnOKElement = Utils.platformSelect({
    ios: '[label="OK"]',
    android: '//android.widget.Button[@text="OK"]',
  });

  btnCancelElement = Utils.platformSelect({
    ios: '[label="Press to cancel your application!"]',
    android: '//android.widget.Button[@resource-id="cancel_button"]',
  });

  submitAlertBoxElement = Utils.platformSelect({
    ios: '[label="Your application has been submitted!"]',
    android: '//android.widget.TextView[@resource-id="android:id/alertTitle"]',
  });

  cancelAlertBoxElement = Utils.platformSelect({
    ios: '[label="Your application has been cancelled!"]',
    android: '//android.widget.TextView[@resource-id="android:id/alertTitle"]',
  });

  async checkButtonsScreenIsDisplayed() {
    return await Utils.getElementText(this.buttonScreenElement);
  }

  async clickSubmitApplication() {
    await Utils.clickElement(this.btnSubmitElement);
  }

  async clickCancelApplication() {
    await Utils.clickElement(this.btnCancelElement);
  }

  async getCancelAlertText() {
    return await Utils.getElementText(this.cancelAlertBoxElement);
  }

  async getSubmitAlertText() {
    return await Utils.getElementText(this.submitAlertBoxElement);
  }

  async clickOkButton() {
    await Utils.clickElement(this.btnOKElement);
  }
}
module.exports = new ButtonComponentScreen();

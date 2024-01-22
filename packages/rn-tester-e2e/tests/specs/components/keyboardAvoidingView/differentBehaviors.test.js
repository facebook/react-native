/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {ComponentsScreen} = require('../../../screens/components.screen.js');
const {
  KeyboardAvoidingViewComponentScreen,
} = require('../../../screens/components/keyboardAvoidingViewComponent.screen.js');

// fixed variables
const registerText = 'Successfully Registered!';

describe('Testing Keyboard Avoiding View with different behaviors Functionality', function () {
  it('Should search for the KeyboardAvoidingView component and check if displayed', async function () {
    await ComponentsScreen.setValueToSearch('KeyboardAvoidingView');
    expect(
      await ComponentsScreen.checkKeyboardAvoidingViewComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on KeyboardAvoidingView component and check if displayed', async function () {
    await ComponentsScreen.clickKeyboardAvoidingViewComponent();
    expect(
      await KeyboardAvoidingViewComponentScreen.checkBtnDifferentBehaviorsOpenExampleIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click to open different behaviors example and check if button is correctly displyed', async function () {
    await KeyboardAvoidingViewComponentScreen.clickDifferentBehaviorsOpenExampleButton();
    expect(
      await KeyboardAvoidingViewComponentScreen.checkBtnRegisterIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click the register button and check if displayed correctly', async function () {
    await KeyboardAvoidingViewComponentScreen.clickRegisterButton();
    expect(
      await KeyboardAvoidingViewComponentScreen.getRegisterAlertText(),
    ).toContain(registerText);
  });
});

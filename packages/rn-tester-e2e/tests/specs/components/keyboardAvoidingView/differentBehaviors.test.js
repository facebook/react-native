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
  it('Should scroll until the KeyboardAvoidingView component is displayed', async function () {
    await KeyboardAvoidingViewComponentScreen.scrollUntilKeyboardAvoidingViewComponentIsDisplayed();
  });

  it('Should display the KeyboardAvoidingView component', async function () {
    expect(
      await ComponentsScreen.checkKeyboardAvoidingViewComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the KeyboardAvoidingView component', async function () {
    await ComponentsScreen.clickKeyboardAvoidingViewComponent();
  });

  it('Should display the button to open different behaviors example', async function () {
    expect(
      await KeyboardAvoidingViewComponentScreen.checkBtnDifferentBehaviorsOpenExampleIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click to open different behaviors example', async function () {
    await KeyboardAvoidingViewComponentScreen.clickDifferentBehaviorsOpenExampleButton();
  });

  it('Should display the register button in the example', async function () {
    expect(
      await KeyboardAvoidingViewComponentScreen.checkBtnRegisterIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click the register button', async function () {
    await KeyboardAvoidingViewComponentScreen.clickRegisterButton();
  });

  it('Should display the successfully registered text', async function () {
    expect(
      await KeyboardAvoidingViewComponentScreen.getRegisterAlertText(),
    ).toContain(registerText);
  });

  it('Should click the OK button', async function () {
    await KeyboardAvoidingViewComponentScreen.clickOkButton();
  });
});

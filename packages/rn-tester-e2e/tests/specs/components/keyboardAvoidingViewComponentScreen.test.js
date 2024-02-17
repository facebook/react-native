/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {ComponentsScreen} = require('../../screens/components.screen.js');
const {
  KeyboardAvoidingViewComponentScreen,
} = require('../../screens/components/keyboardAvoidingViewComponent.screen.js');

// fixed variables
const registerText = 'Successfully Registered!';

describe('Test is checking keyboardAvoidingView component', () => {
  test('Should view properly successfully registered text', async () => {
    await KeyboardAvoidingViewComponentScreen.scrollUntilKeyboardAvoidingViewComponentIsDisplayed();
    expect(
      await ComponentsScreen.checkKeyboardAvoidingViewComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickKeyboardAvoidingViewComponent();
    expect(
      await KeyboardAvoidingViewComponentScreen.checkBtnDifferentBehaviorsOpenExampleIsDisplayed(),
    ).toBeTruthy();
    await KeyboardAvoidingViewComponentScreen.clickDifferentBehaviorsOpenExampleButton();
    expect(
      await KeyboardAvoidingViewComponentScreen.checkBtnRegisterIsDisplayed(),
    ).toBeTruthy();
    await KeyboardAvoidingViewComponentScreen.clickRegisterButton();
    expect(
      await KeyboardAvoidingViewComponentScreen.getRegisterAlertText(),
    ).toContain(registerText);
    await KeyboardAvoidingViewComponentScreen.clickOkButton();
  });
});

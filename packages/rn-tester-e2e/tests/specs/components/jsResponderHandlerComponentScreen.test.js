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
  JSResponderHandlerComponentScreen,
} = require('../../screens/components/jsResponderHandlerComponent.screen.js');

// fixed variables
const roweZeroText = 'I am row 0';

describe('Test is checking row zero JSResponderHandler component', () => {
  test('Should view properly row zero element', async () => {
    await JSResponderHandlerComponentScreen.scrollUntilJSResponderHandlerComponentIsDisplayed();
    expect(
      await ComponentsScreen.checkJSResponderHandlerComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickJSResponderHandlerComponent();
    expect(
      await JSResponderHandlerComponentScreen.checkRowZeroLabelIsDisplayed(),
    ).toBeTruthy();
    expect(await JSResponderHandlerComponentScreen.getRowZeroText()).toContain(
      roweZeroText,
    );
  });
});

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
  JSResponderHandlerComponentScreen,
} = require('../../../screens/components/jsResponderHandlerComponent.screen.js');

// fixed variables
const roweZeroText = 'I am row 0';

describe('Testing row zero of JSResponderHandler Functionality Testis checking row zero JSResponderHandler component', function () {
  it('Should scroll to JSResponderHandler component', async function () {
    await JSResponderHandlerComponentScreen.scrollUntilJSResponderHandlerComponentIsDisplayed();
  });

  it('Should check visiblity of component element', async function () {
    expect(
      await ComponentsScreen.checkJSResponderHandlerComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on component element', async function () {
    await ComponentsScreen.clickJSResponderHandlerComponent();
  });

  it('Should view properly row zero element', async function () {
    expect(
      await JSResponderHandlerComponentScreen.checkRowZeroLabelIsDisplayed(),
    ).toBeTruthy();
    expect(await JSResponderHandlerComponentScreen.getRowZeroText()).toContain(
      roweZeroText,
    );
  });
});

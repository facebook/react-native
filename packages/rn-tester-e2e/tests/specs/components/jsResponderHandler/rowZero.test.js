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
  it('Should search for JSResponderHandler component and check component visibility', async function () {
    await ComponentsScreen.setValueToSearch('JSResponderHandler');
    expect(
      await ComponentsScreen.checkJSResponderHandlerComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on component element and check visibility of row zero element', async function () {
    await ComponentsScreen.clickJSResponderHandlerComponent();
    expect(
      await JSResponderHandlerComponentScreen.checkRowZeroLabelIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should check text of row zero element text', async function () {
    expect(await JSResponderHandlerComponentScreen.getRowZeroText()).toContain(
      roweZeroText,
    );
  });
});

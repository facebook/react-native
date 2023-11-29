/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {ComponentsScreen} = require('../../../screens/components.screen.js');
const {
  FlatListComponentScreen,
} = require('../../../screens/components/flatListComponent.screen.js');

describe('Testing Sticky Headers Flat List Functionality', function () {
  it('Should check if FlatList component si displayed then click on it', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    expect(
      await FlatListComponentScreen.checkFlatListContentInsetScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should search for Nested component and check if button is displayed', async function () {
    await ComponentsScreen.setValueToSearch('Sticky Headers');
    expect(
      await FlatListComponentScreen.checkFlatListStickyHeadersScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click the Sticky Headers button and check if sticky pizza is displayed after click', async function () {
    await FlatListComponentScreen.clickFlatListStickyHeadersButton();
    expect(
      await FlatListComponentScreen.checkStickyPizzaIsDisplayed(),
    ).toBeTruthy();
  });
});

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

describe('Testing Inverted Flat List Functionality', function () {
  it('Should display the FlatList component then click on it', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    expect(
      await FlatListComponentScreen.checkFlatListContentInsetScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should search for onViewableItemsChanged and check if displayed', async function () {
    await ComponentsScreen.setValueToSearch('Inverted');
    expect(
      await FlatListComponentScreen.checkFlatListInvertedScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click the FlatList Inverted button and check if pizza item is displayed', async function () {
    await FlatListComponentScreen.clickFlatListInvertedButton();
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
  });

  it('Should toggld the True button then check if pizza item is displayed', async function () {
    await FlatListComponentScreen.clickToggleTrueButton();
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
  });
});

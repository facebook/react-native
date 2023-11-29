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

describe('Testing onViewableItemsChanges Flat List Functionality', function () {
  it('Should display the FlatList component then click on it', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    expect(
      await FlatListComponentScreen.checkFlatListContentInsetScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should search for onViewableItemsChanged and check if button is displayed', async function () {
    await ComponentsScreen.setValueToSearch('onViewableItemsChanged');
    expect(
      await FlatListComponentScreen.checkFlatListOnViewableItemsChangedScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click onViewableItemsChanged button and check if pizza is displayed after click', async function () {
    await FlatListComponentScreen.clickFlatListOnViewableItemsChangedButton();
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
  });
});

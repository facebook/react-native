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
  it('Should display the FlatList component', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the FlatList component', async function () {
    await ComponentsScreen.clickFlatListComponent();
  });

  it('Should scroll until onViewableItemsChanged is displayed', async function () {
    await FlatListComponentScreen.scrollUntilOnViewableItemsChangedIsDisplayed();
  });

  it('Should display the FlatList onViewableItemsChanged Screen', async function () {
    expect(
      await FlatListComponentScreen.checkFlatListOnViewableItemsChangedScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click onViewableItemsChanged button', async function () {
    await FlatListComponentScreen.clickFlatListOnViewableItemsChangedButton();
  });

  it('Should display the pizza after clicking onViewableItemsChanged button', async function () {
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
  });
});

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
  it('Should display the FlatList component', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on FlatList component', async function () {
    await ComponentsScreen.clickFlatListComponent();
  });

  it('Should scroll until onViewableItemsChanged is displayed', async function () {
    await FlatListComponentScreen.scrollUntilOnViewableItemsChangedIsDisplayed();
  });

  it('Should display the FlatList Inverted Screen after scrolling', async function () {
    expect(
      await FlatListComponentScreen.checkFlatListInvertedScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click the FlatList Inverted button', async function () {
    await FlatListComponentScreen.clickFlatListInvertedButton();
  });

  it('Should display the pizza item after clicking the FlatList Inverted button', async function () {
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
  });

  it('Should allow toggling the True button', async function () {
    await FlatListComponentScreen.clickToggleTrueButton();
  });

  it('Should still display the pizza item after toggling the True button', async function () {
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
  });
});

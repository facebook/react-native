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

describe('Test is checking inverted flat list', function () {
  it('Should view properly the menu element', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    await FlatListComponentScreen.scrollUntilOnViewableItemsChangedIsDisplayed();
    expect(
      await FlatListComponentScreen.checkFlatListInvertedScreenIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListInvertedButton();
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
    await FlatListComponentScreen.clickToggleTrueButton();
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
  });
});

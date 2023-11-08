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
  it('Should display the FlatList component', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the FlatList component', async function () {
    await ComponentsScreen.clickFlatListComponent();
  });

  it('Should scroll until the Nested element is displayed', async function () {
    await FlatListComponentScreen.scrollUntilNestedIsDisplayed();
  });

  it('Should display the FlatList Sticky Headers Screen', async function () {
    expect(
      await FlatListComponentScreen.checkFlatListStickyHeadersScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click the Sticky Headers button', async function () {
    await FlatListComponentScreen.clickFlatListStickyHeadersButton();
  });

  it('Should display the sticky pizza after clicking the Sticky Headers button', async function () {
    expect(
      await FlatListComponentScreen.checkStickyPizzaIsDisplayed(),
    ).toBeTruthy();
  });
});

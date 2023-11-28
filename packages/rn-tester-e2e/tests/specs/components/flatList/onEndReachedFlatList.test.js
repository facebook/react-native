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

describe('Testing onEndReached Flat List Functionality', function () {
  it('Should display the FlatList component', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the FlatList component then check if FlatList OnEndReached button is displayed', async function () {
    await ComponentsScreen.clickFlatListComponent();
    expect(
      await FlatListComponentScreen.checkFlatListOnEndReachedScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the OnEndReached button then check if component screen is displayed', async function () {
    await FlatListComponentScreen.clickFlatListOnEndButton();
    expect(
      await FlatListComponentScreen.checkCollapseButtonIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the OnStartTest button and check if ice cream is displayed after click', async function () {
    await FlatListComponentScreen.clickFlatListOnStartTestButton();
    expect(
      await FlatListComponentScreen.checkIceCreamIsDisplayed(),
    ).toBeTruthy();
  });
});

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

describe('Testing onStartReached Flat List Functionality', function () {
  it('Should display the FlatList component', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the FlatList component and check if OnStartReached button is displayed', async function () {
    await ComponentsScreen.clickFlatListComponent();
    expect(
      await FlatListComponentScreen.checkFlatListOnStartReachedScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the OnStartReached and check if OnStartReached screen is visible', async function () {
    await FlatListComponentScreen.clickFlatListOnStartButton();
    expect(
      await FlatListComponentScreen.checkCollapseButtonIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the OnStartTest button and check if pizza is displayed after click', async function () {
    await FlatListComponentScreen.clickFlatListOnStartTestButton();
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
  });
});

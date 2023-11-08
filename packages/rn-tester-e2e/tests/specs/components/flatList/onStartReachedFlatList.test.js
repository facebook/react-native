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

  it('Should click on the FlatList component', async function () {
    await ComponentsScreen.clickFlatListComponent();
  });

  it('Should display the FlatList OnStartReached Screen', async function () {
    expect(
      await FlatListComponentScreen.checkFlatListOnStartReachedScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the OnStartReached button', async function () {
    await FlatListComponentScreen.clickFlatListOnStartButton();
  });

  it('Should display the collapse button after clicking on the OnStartReached button', async function () {
    expect(
      await FlatListComponentScreen.checkCollapseButtonIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the OnStartTest button', async function () {
    await FlatListComponentScreen.clickFlatListOnStartTestButton();
  });

  it('Should display the pizza after clicking on the OnStartTest button', async function () {
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
  });
});

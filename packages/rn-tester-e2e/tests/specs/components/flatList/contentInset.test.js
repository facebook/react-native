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

describe('Testing Content Inset Flat List Functionality', function () {
  it('Should display the FlatList component', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on FlatList component', async function () {
    await ComponentsScreen.clickFlatListComponent();
  });

  it('Should display the FlatList Content Inset Screen after clicking FlatList component', async function () {
    expect(
      await FlatListComponentScreen.checkFlatListContentInsetScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click the FlatList Content Inset button', async function () {
    await FlatListComponentScreen.clickFlatListContentInsetButton();
  });

  it('Should display the collapse button after clicking FlatList Content Inset button', async function () {
    expect(
      await FlatListComponentScreen.checkCollapseButtonIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should display the Content Inset menu after clicking FlatList Content Inset button', async function () {
    expect(
      await FlatListComponentScreen.checkContentInsetMenuIsDisplayed(),
    ).toBeTruthy();
  });
});

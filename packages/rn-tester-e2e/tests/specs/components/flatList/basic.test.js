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

describe('Testing Basic Flat List Functionality', function () {
  it('Should view properly the FlatList component', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Click on FlatList component', async function () {
    await ComponentsScreen.clickFlatListComponent();
  });

  it('Should view properly the FlatList Content Inset Screen', async function () {
    expect(
      await FlatListComponentScreen.checkFlatListContentInsetScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Click on FlatList Content Inset button', async function () {
    await FlatListComponentScreen.clickFlatListContentInsetButton();
  });

  it('Should view properly the collapse button', async function () {
    expect(
      await FlatListComponentScreen.checkCollapseButtonIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should view properly the Content Inset menu', async function () {
    expect(
      await FlatListComponentScreen.checkContentInsetMenuIsDisplayed(),
    ).toBeTruthy();
  });
});

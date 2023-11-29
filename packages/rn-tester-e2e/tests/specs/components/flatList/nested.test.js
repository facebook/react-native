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

describe('Testing Nested Flat List Functionality', function () {
  it('Should display the FlatList component and open it', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    expect(
      await FlatListComponentScreen.checkFlatListContentInsetScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should search for nested and check if element is displayed', async function () {
    await ComponentsScreen.setValueToSearch('Nested');
    expect(
      await FlatListComponentScreen.checkFlatListNestedScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click the FlatList Nested button and check if header is displayed', async function () {
    await FlatListComponentScreen.clickFlatListNestedButton();
    expect(
      await FlatListComponentScreen.checkNestedHeaderIsDisplayed(),
    ).toBeTruthy();
  });
});

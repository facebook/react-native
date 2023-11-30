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

describe('Testing Flat List with Separators Functionality', function () {
  it('Should display the FlatList component', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should open FlatList component and search for FlatList with Separators', async function () {
    await ComponentsScreen.clickFlatListComponent();
    await ComponentsScreen.setValueToSearch('FlatList with Separators');
    expect(
      await FlatListComponentScreen.checkFlatListWithSeparatorsScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should open the FlatList with Separators and check if button is correctly displyed', async function () {
    await FlatListComponentScreen.clickFlatListWithSeparatorsButton();
    expect(
      await FlatListComponentScreen.checkSeparatorIsDisplayed(),
    ).toBeTruthy();
  });
});

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

  it('Should click on FlatList component', async function () {
    await ComponentsScreen.clickFlatListComponent();
  });

  it('Should scroll until nested element is displayed', async function () {
    await FlatListComponentScreen.scrollUntilNestedIsDisplayed();
  });

  it('Should display the FlatList with Separators Screen after scrolling', async function () {
    expect(
      await FlatListComponentScreen.checkFlatListWithSeparatorsScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click the FlatList with Separators button', async function () {
    await FlatListComponentScreen.clickFlatListWithSeparatorsButton();
  });

  it('Should display the separator after clicking the FlatList with Separators button', async function () {
    expect(
      await FlatListComponentScreen.checkSeparatorIsDisplayed(),
    ).toBeTruthy();
  });
});

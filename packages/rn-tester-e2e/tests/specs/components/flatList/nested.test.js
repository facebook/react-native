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
  it('Should display the FlatList component', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the FlatList component', async function () {
    await ComponentsScreen.clickFlatListComponent();
  });

  it('Should scroll until the nested element is displayed', async function () {
    await FlatListComponentScreen.scrollUntilNestedIsDisplayed();
  });

  it('Should display the FlatList Nested Screen after scrolling', async function () {
    expect(
      await FlatListComponentScreen.checkFlatListNestedScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click the FlatList Nested button', async function () {
    await FlatListComponentScreen.clickFlatListNestedButton();
  });

  it('Should display the nested header after clicking the FlatList Nested button', async function () {
    expect(
      await FlatListComponentScreen.checkNestedHeaderIsDisplayed(),
    ).toBeTruthy();
  });
});

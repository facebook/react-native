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

describe('Testing MultiColumn Functionality', function () {
  it('Should display the FlatList component and open it', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
  });

  it('Should scroll until the nested element is displayed', async function () {
    await FlatListComponentScreen.scrollUntilNestedIsDisplayed();
    expect(
      await FlatListComponentScreen.checkFlatListMultiColumnScreenIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should open the FlatList MultiColumn button and check if list header is displayed', async function () {
    await FlatListComponentScreen.clickFlatListMultiColumnButton();
    expect(
      await FlatListComponentScreen.checkListHeaderIsDisplayed(),
    ).toBeTruthy();
  });
});

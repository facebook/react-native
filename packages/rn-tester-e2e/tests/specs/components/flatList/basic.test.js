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

describe('Test is checking basic flat list', function () {
  it('Should view properly search bar of basic flat list', async function () {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    expect(
      await FlatListComponentScreen.checkFlatListBasicScreenIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListBasicButton();
    expect(
      await FlatListComponentScreen.checkSearchBarIsDisplayed(),
    ).toBeTruthy();
  });
});

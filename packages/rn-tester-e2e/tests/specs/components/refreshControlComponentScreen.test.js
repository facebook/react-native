/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {ComponentsScreen} = require('../../screens/components.screen.js');
const {
  RefreshControlComponentScreen,
} = require('../../screens/components/refreshControlComponent.screen.js');

describe('Test is checking RefreshControl component', () => {
  test('Should view initial row element', async () => {
    await RefreshControlComponentScreen.scrollUntilRefreshControlComponentIsDisplayed();
    expect(
      await ComponentsScreen.checkRefreshControlComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickRefreshControlComponent();
    expect(
      await RefreshControlComponentScreen.checkInitialRowIsDisplayed(),
    ).toBeTruthy();
  });
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {ComponentsScreen} = require('../../../screens/components.screen.js');
const {
  RefreshControlComponentScreen,
} = require('../../../screens/components/refreshControlComponent.screen.js');

describe('Testing if any Initial Row is visible', function () {
  it('Should scroll until the Refresh Control component is displayed', async function () {
    await RefreshControlComponentScreen.scrollUntilRefreshControlComponentIsDisplayed();
  });

  it('Should verify that the Refresh Control component is visible', async function () {
    expect(
      await ComponentsScreen.checkRefreshControlComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the Refresh Control component', async function () {
    await ComponentsScreen.clickRefreshControlComponent();
  });

  it('Should check that the initial row is displayed', async function () {
    expect(
      await RefreshControlComponentScreen.checkInitialRowIsDisplayed(),
    ).toBeTruthy();
  });
});

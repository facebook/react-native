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
  it('Should search for the Refresh Control component and check if displayed', async function () {
    await ComponentsScreen.setValueToSearch('RefreshControl');
    expect(
      await ComponentsScreen.checkRefreshControlComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the Refresh Control component and check if initial row is displayed', async function () {
    await ComponentsScreen.clickRefreshControlComponent();
    expect(
      await RefreshControlComponentScreen.checkInitialRowIsDisplayed(),
    ).toBeTruthy();
  });
});

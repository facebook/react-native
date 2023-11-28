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
  ActivityIndicatorComponentScreen,
} = require('../../../screens/components/activityIndicatorComponent.screen.js');

describe('Testing Default Activity Indicator Functionality', function () {
  before(async function (capabilities, specs) {
    //Added it for make sure that metro bundler is completed
    await ComponentsScreen.checkComponentScreenHeaderIsDisplayed();
  });

  it('Should ensure the Activity Indicator component is displayed', async () => {
    expect(
      await ComponentsScreen.checkActivityIndicatorComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should open Activity Indicator component screen and check if displayed', async () => {
    await ComponentsScreen.clickActivityIndicatorComponent();
    expect(
      await ActivityIndicatorComponentScreen.checkDefaultActivityIndicatorIsDisplayed(),
    ).toBeTruthy();
  });
});

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
  ActivityIndicatorComponentScreen,
} = require('../../screens/components/activityIndicatorComponent.screen.js');

describe('Test is checking default activity indicator component', () => {
  test('Should view properly default progress bar', async () => {
    expect(
      await ComponentsScreen.checkActivityIndicatorComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickActivityIndicatorComponent();
    expect(
      await ActivityIndicatorComponentScreen.checkDefaultActivityIndicatorIsDisplayed(),
    ).toBeTruthy();
  });
});

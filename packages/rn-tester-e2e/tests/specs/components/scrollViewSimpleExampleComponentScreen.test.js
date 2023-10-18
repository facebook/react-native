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
  ScrollViewSimpleExampleComponentScreen,
} = require('../../screens/components/scrollViewSimpleExampleComponent.screen.js');

describe('Test is checking ScrollVIewSimpleExample component', () => {
  test('Should view scroll view item element', async () => {
    await ScrollViewSimpleExampleComponentScreen.scrollUntilScrollViewSimpleExampleComponentIsDisplayed();
    expect(
      await ComponentsScreen.checkScrollViewSimpleExampleComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickScrollViewSimpleExampleComponent();
    expect(
      await ScrollViewSimpleExampleComponentScreen.checkScrollViewItemsDisplayed(),
    ).toBeTruthy();
  });
});

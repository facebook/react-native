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
  ScrollViewSimpleExampleComponentScreen,
} = require('../../../screens/components/scrollViewSimpleExampleComponent.screen.js');

describe('Testing first item visibility of ScrollViewSimpleExample Component', function () {
  it('Should search for the Scroll View Simple Example component and check if displayed', async function () {
    await ComponentsScreen.setValueToSearch('ScrollViewSimpleExample');
    expect(
      await ComponentsScreen.checkScrollViewSimpleExampleComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the Scroll View Simple Example component and verify if displayed', async function () {
    await ComponentsScreen.clickScrollViewSimpleExampleComponent();
    expect(
      await ScrollViewSimpleExampleComponentScreen.checkScrollViewItemsDisplayed(),
    ).toBeTruthy();
  });
});

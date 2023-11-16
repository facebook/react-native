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
  ModalComponentScreen,
} = require('../../screens/components/modalComponent.screen.js');

describe('Test is checking modal component', () => {
  test('Should view show modal element', async () => {
    await ModalComponentScreen.scrollUntilModalComponentIsDisplayed();
    expect(
      await ComponentsScreen.checkModalComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickModalComponent();
    expect(await ModalComponentScreen.checkShowModalIsDisplayed()).toBeTruthy();
    await ModalComponentScreen.clickShowModalButton();
    expect(
      await ModalComponentScreen.checkModalAnimationTypeIsDisplayed(),
    ).toBeTruthy();
    await ModalComponentScreen.clickCloseButton();
    expect(await ModalComponentScreen.checkShowModalIsDisplayed()).toBeTruthy();
  });
});

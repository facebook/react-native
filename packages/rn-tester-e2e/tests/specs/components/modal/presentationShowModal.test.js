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
  ModalComponentScreen,
} = require('../../../screens/components/modalComponent.screen.js');

describe('Testing Show Modal button of Modal Presentation Functionality', function () {
  it('Should scroll until the Modal component check if it is displayed', async function () {
    await ComponentsScreen.setValueToSearch('Modal');
    expect(
      await ComponentsScreen.checkModalComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the Modal component and check if Show Modal button is displayed', async function () {
    await ComponentsScreen.clickModalComponent();
    expect(await ModalComponentScreen.checkShowModalIsDisplayed()).toBeTruthy();
  });

  it('Should click on the Show Modal button and check that the modal with the animation type is displayed', async function () {
    await ModalComponentScreen.clickShowModalButton();
    expect(
      await ModalComponentScreen.checkModalAnimationTypeIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the Close button within the Modal and check if closed correctly', async function () {
    await ModalComponentScreen.clickCloseButton();
    expect(await ModalComponentScreen.checkShowModalIsDisplayed()).toBeTruthy();
  });
});

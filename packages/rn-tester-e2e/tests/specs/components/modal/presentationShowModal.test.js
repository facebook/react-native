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
  it('Should scroll until the Modal component is displayed', async function () {
    await ModalComponentScreen.scrollUntilModalComponentIsDisplayed();
  });

  it('Should check that the Modal component is displayed', async function () {
    expect(
      await ComponentsScreen.checkModalComponentIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the Modal component', async function () {
    await ComponentsScreen.clickModalComponent();
  });

  it('Should check that the Show Modal button is displayed', async function () {
    expect(await ModalComponentScreen.checkShowModalIsDisplayed()).toBeTruthy();
  });

  it('Should click on the Show Modal button', async function () {
    await ModalComponentScreen.clickShowModalButton();
  });

  it('Should check that the Modal with the animation type is displayed', async function () {
    expect(
      await ModalComponentScreen.checkModalAnimationTypeIsDisplayed(),
    ).toBeTruthy();
  });

  it('Should click on the Close button within the Modal', async function () {
    await ModalComponentScreen.clickCloseButton();
  });

  it('Should verify the Show Modal is still displayed after closing the Modal', async function () {
    expect(await ModalComponentScreen.checkShowModalIsDisplayed()).toBeTruthy();
  });
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {
  UtilsSingleton as Utils,
  androidWidget,
  iOSName,
} from '../../helpers/utils';

type ModalComponentScreenType = {
  modalScreenElement: string,
  btnShowModalElement: string,
  modalAnimationTypeTextElement: string,
  modalModeTextElement: string,
  btnCloseElement: string,
  checkShowModalIsDisplayed: () => Promise<boolean>,
  checkModalAnimationTypeIsDisplayed: () => Promise<boolean>,
  scrollUntilModalComponentIsDisplayed: () => Promise<void>,
  clickShowModalButton: () => Promise<void>,
  clickCloseButton: () => Promise<void>,
};

const showModalBtnText = 'Show Modal';

export const ModalComponentScreen: ModalComponentScreenType = {
  // reference in the Components list
  modalScreenElement: Utils.platformSelect({
    ios: iOSName('Modal'),
    android: androidWidget('TextView', 'text', 'Modal'),
  }),
  // References to elements within the Modal Component screen
  btnShowModalElement: Utils.platformSelect({
    ios: iOSName(showModalBtnText),
    android: androidWidget('TextView', 'text', showModalBtnText),
  }),
  modalAnimationTypeTextElement: Utils.platformSelect({
    ios: iOSName('modal_animationType_text'),
    android: androidWidget(
      'TextView',
      'resource-id',
      'modal_animationType_text',
    ),
  }),
  modalModeTextElement: Utils.platformSelect({
    ios: iOSName('modal_animationType_text'),
    android: androidWidget(
      'TextView',
      'resource-id',
      'row_js_responder_handler',
    ),
  }),
  btnCloseElement: Utils.platformSelect({
    ios: iOSName('Close'),
    android: androidWidget('TextView', 'text', 'Close'),
  }),
  // Methods to interact with the elements
  checkShowModalIsDisplayed: async function (
    this: ModalComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.btnShowModalElement);
  },
  checkModalAnimationTypeIsDisplayed: async function (
    this: ModalComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(
      this.modalAnimationTypeTextElement,
    );
  },
  scrollUntilModalComponentIsDisplayed: async function (
    this: ModalComponentScreenType,
  ): Promise<void> {
    return await Utils.scrollToElement(this.modalScreenElement);
  },
  clickShowModalButton: async function (
    this: ModalComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.btnShowModalElement);
  },
  clickCloseButton: async function (
    this: ModalComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.btnCloseElement);
  },
};

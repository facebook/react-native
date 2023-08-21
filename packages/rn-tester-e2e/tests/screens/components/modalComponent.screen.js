/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {
  UtilsSingleton as Utils,
  iOSLabel,
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
  checkModalModeIsDisplayed: () => Promise<boolean>,
  clickShowModalButton: () => Promise<void>,
  clickCloseButton: () => Promise<void>,
};

export const ModalComponentScreen: ModalComponentScreenType = {
  // reference in the Components list
  modalScreenElement: Utils.platformSelect({
    ios: iOSLabel('Modal'),
    android: androidWidget('ViewGroup', 'resource-id', 'Modal'),
  }),
  // References to elements within the Modal Component screen
  btnShowModalElement: Utils.platformSelect({
    ios: iOSName('Show Modal'),
    android: androidWidget('TextView', 'text', 'Show Modal'),
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

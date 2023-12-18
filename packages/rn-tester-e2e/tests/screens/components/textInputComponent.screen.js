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
  iOSName,
  androidWidget,
} from '../../helpers/utils';

type TextInputComponentScreenType = {
  textInputScreenElement: string,
  textInputReWriteElement: string,
  textInputNoSpaceAllowElement: string,
  textInputReWriteClearElement: string,
  textInputControlledDoubleSpaceElement: string,
  btnClearElement: string,
  checkTextIsReWrited: () => Promise<string>,
  checkLongTextIsReWrited: () => Promise<string>,
  checkNoSpaceAllowed: () => Promise<string>,
  checkAddTextAndClearButton: () => Promise<string>,
  checkDoubleSpaceControlledTextInput: () => Promise<string>,
  scrollToTextAndClearButtonElement: () => Promise<void>,
  scrollToDoubleSpaceElement: () => Promise<void>,
  scrollUntilTextInputComponentIsDisplayed: () => Promise<void>,
};

export const TextInputComponentScreen: TextInputComponentScreenType = {
  // reference in the Components list
  textInputScreenElement: Utils.platformSelect({
    ios: iOSName('TextInput'),
    android: androidWidget('TextView', 'text', 'TextInput'),
  }),
  // References to elements within the Button Component screen
  textInputReWriteElement: Utils.platformSelect({
    ios: iOSName('rewrite_sp_underscore_input'),
    android: androidWidget(
      'EditText',
      'resource-id',
      'rewrite_sp_underscore_input',
    ),
  }),
  textInputNoSpaceAllowElement: Utils.platformSelect({
    ios: iOSName('rewrite_no_sp_input'),
    android: androidWidget('EditText', 'resource-id', 'rewrite_no_sp_input'),
  }),
  textInputReWriteClearElement: Utils.platformSelect({
    ios: iOSName('rewrite_clear_input'),
    android: androidWidget('EditText', 'resource-id', 'rewrite_clear_input'),
  }),
  btnClearElement: Utils.platformSelect({
    ios: iOSName('rewrite_clear_button'),
    android: androidWidget('Button', 'resource-id', 'rewrite_clear_button'),
  }),
  textInputControlledDoubleSpaceElement: Utils.platformSelect({
    ios: iOSName('rewrite_double_space'),
    android: androidWidget('Button', 'resource-id', 'rewrite_double_space'),
  }),
  // Methods to interact with the elements
  checkTextIsReWrited: async function (
    this: TextInputComponentScreenType,
  ): Promise<string> {
    const text = 'foo space replace';
    await Utils.clickElement(this.textInputReWriteElement);
    await Utils.setElementText(this.textInputReWriteElement, text);
    return await Utils.getElementText(this.textInputReWriteElement);
  },
  checkLongTextIsReWrited: async function (
    this: TextInputComponentScreenType,
  ): Promise<string> {
    const text = 'foobars space replacement';
    await Utils.clickElement(this.textInputReWriteElement);
    await Utils.setElementText(this.textInputReWriteElement, text);
    return Utils.getElementText(this.textInputReWriteElement);
  },
  checkNoSpaceAllowed: async function (
    this: TextInputComponentScreenType,
  ): Promise<string> {
    const text = 'foo bar no space test';
    await Utils.clickElement(this.textInputNoSpaceAllowElement);
    await Utils.setElementText(this.textInputNoSpaceAllowElement, text);
    return await Utils.getElementText(this.textInputNoSpaceAllowElement);
  },
  checkAddTextAndClearButton: async function (
    this: TextInputComponentScreenType,
  ): Promise<string> {
    const text = 'testing clear text';
    await Utils.clickElement(this.textInputReWriteClearElement);
    await Utils.setElementText(this.textInputReWriteClearElement, text);
    await Utils.clickElement(this.btnClearElement);
    return await Utils.getElementText(this.textInputReWriteClearElement);
  },
  checkDoubleSpaceControlledTextInput: async function (
    this: TextInputComponentScreenType,
  ): Promise<string> {
    const text = 'testing';
    await Utils.setElementText(
      this.textInputControlledDoubleSpaceElement,
      text,
    );
    await Utils.doubleTapKeyboardSpacebar(
      this.textInputControlledDoubleSpaceElement,
    );
    return await Utils.getElementText(
      this.textInputControlledDoubleSpaceElement,
    );
  },
  clickSubmitApplication: async function (
    this: TextInputComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.btnSubmitElement);
  },
  scrollUntilTextInputComponentIsDisplayed: async function (
    this: TextInputComponentScreenType,
  ): Promise<void> {
    return await Utils.scrollToElement(this.textInputScreenElement);
  },
  scrollToTextAndClearButtonElement: async function (
    this: TextInputComponentScreenType,
  ): Promise<void> {
    await Utils.scrollToElement(this.textInputReWriteClearElement);
  },
  scrollToDoubleSpaceElement: async function (
    this: TextInputComponentScreenType,
  ): Promise<void> {
    await Utils.scrollToElement(this.textInputControlledDoubleSpaceElement);
  },
};

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {UtilsSingleton as Utils, iOSLabel} from '../helpers/utils';

// root level screen in RNTester: Components

const buttonComponentLabel = 'Button Simple React Native button component.';
const activityIndicatorComponentLabel = 'ActivityIndicator Animated loading indicators.';
const imageComponentLabel = 'Image Base component for displaying different types of images.';
const flatListComponentLabel = 'FlatList Performant, scrollable list of data.';
const jsResponderHandlerComponentLabel = 'JSResponderHandler Simple example to test JSResponderHandler.';
const modalComponentLabel = 'Modal Component for presenting modal views.';
const newAppScreenComponentLabel = 'New App Screen Displays the content of the new app screen';
const pressableComponentLabel = 'Pressable Component for making views pressable.';

type ComponentsScreenType = {
  buttonComponentLabelElement: string,
  activityIndicatorComponentLabelElement: string,
  imageComponentLabelElement: string,
  flatListComponentLabelElement: string,
  jsResponderHandlerComponentLabelElement: string,
  modalComponentElement: string,
  newAppScreenComponentElement: string,
  pressableComponentElement: string,
  checkButtonComponentIsDisplayed: () => Promise<boolean>,
  checkActivityIndicatorComponentIsDisplayed: () => Promise<boolean>,
  checkImageComponentIsDisplayed: () => Promise<boolean>,
  checkFlatListComponentIsDisplayed: () => Promise<boolean>,
  checkJSResponderHandlerComponentIsDisplayed: () => Promise<boolean>,
  checkModalComponentIsDisplayed: () => Promise<boolean>,
  checkNewAppScreenComponentIsDisplayed: () => Promise<boolean>,
  checkPressableComponentIsDisplayed: () => Promise<boolean>,
  clickButtonComponent: () => Promise<void>,
  clickActivityIndicatorComponent: () => Promise<void>,
  clickImageComponent: () => Promise<void>,
  clickFlatListComponent: () => Promise<void>,
  clickJSResponderHandlerComponent: () => Promise<void>,
  clickModalComponent: () => Promise<void>,
  clickNewAppScreenComponent: () => Promise<void>,
  clickPressableComponent: () => Promise<void>,
};

export const ComponentsScreen: ComponentsScreenType = {
  // Reference in the top level Component list
  buttonComponentLabelElement: Utils.platformSelect({
    ios: iOSLabel(buttonComponentLabel),
    android: `~${buttonComponentLabel}`,
  }),
  activityIndicatorComponentLabelElement: Utils.platformSelect({
    ios: iOSLabel(activityIndicatorComponentLabel),
    android: `~${activityIndicatorComponentLabel}`,
  }),
  imageComponentLabelElement: Utils.platformSelect({
    ios: iOSLabel(imageComponentLabel),
    android: `~${imageComponentLabel}`,
  }),
  flatListComponentLabelElement: Utils.platformSelect({
    ios: iOSLabel(flatListComponentLabel),
    android: `~${flatListComponentLabel}`,
  }),
  jsResponderHandlerComponentLabelElement: Utils.platformSelect({
    ios: iOSLabel(jsResponderHandlerComponentLabel),
    android: `~${jsResponderHandlerComponentLabel}`,
  }),
  modalComponentLabelElement: Utils.platformSelect({
    ios: iOSLabel(modalComponentLabel),
    android: `~${modalComponentLabel}`,
  }),
  newAppScreenComponentLabelElement: Utils.platformSelect({
    ios: iOSLabel(newAppScreenComponentLabel),
    android: `~${newAppScreenComponentLabel}`,
  }),
  pressableComponentLabelElement: Utils.platformSelect({
    ios: iOSLabel(pressableComponentLabel),
    android: `~${pressableComponentLabel}`,
  }),
  // Methods to interact with top level elements in the list
  checkButtonComponentIsDisplayed: async function (
    this: ComponentsScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.buttonComponentLabelElement);
  },
  checkActivityIndicatorComponentIsDisplayed: async function (
    this: ComponentsScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.activityIndicatorComponentLabelElement);
  },
  checkImageComponentIsDisplayed: async function (
    this: ComponentsScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.imageComponentLabelElement);
  },
  checkFlatListComponentIsDisplayed: async function (
    this: ComponentsScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.flatListComponentLabelElement);
  },
  checkJSResponderHandlerComponentIsDisplayed: async function (
    this: ComponentsScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.jsResponderHandlerComponentLabelElement);
  },
  checkModalComponentIsDisplayed: async function (
    this: ComponentsScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.modalComponentLabelElement);
  },
  checkNewAppScreenComponentIsDisplayed: async function (
    this: ComponentsScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.newAppScreenComponentLabelElement);
  },
  checkPressableComponentIsDisplayed: async function (
    this: ComponentsScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.pressableComponentLabelElement);
  },
  clickButtonComponent: async function (
    this: ComponentsScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.buttonComponentLabelElement);
  },
  clickActivityIndicatorComponent: async function (
    this: ComponentsScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.activityIndicatorComponentLabelElement);
  },
  clickImageComponent: async function (
    this: ComponentsScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.imageComponentLabelElement);
  },
  clickFlatListComponent: async function (
    this: ComponentsScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.flatListComponentLabelElement);
  },
  clickJSResponderHandlerComponent: async function (
    this: ComponentsScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.jsResponderHandlerComponentLabelElement);
  },
  clickModalComponent: async function (
    this: ComponentsScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.modalComponentLabelElement);
  },
  clickNewAppScreenComponent: async function (
    this: ComponentsScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.newAppScreenComponentLabelElement);
  },
  clickPressableComponent: async function (
    this: ComponentsScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.pressableComponentLabelElement);
  },
};

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

type flatListComponentScreenType = {
    flatListScreenElement: string,
    basicScreenElement: string,
    onStartReachedScreenElement: string,
    onEndReachedScreenElement: string,
    contentInsetScreenElement: string,
    invertedScreenElement: string,
    basicSearchBarScreenElement: string,
    btnCollapseElement: string,
    btnToggleTrueElement: string,
    btnToogleFalseElement: string,
    onStartBtnTestElement: string,
    onStartPizzaElement: string,
    onStartIceCreamElement: string,
    contentInsetMenuElement: string,
    checkFlatListBasicScreenIsDisplayed: () => Promise<boolean>,
    checkFlatListOnStartReachedScreenIsDisplayed: () => Promise<boolean>,
    checkFlatListOnEndReachedScreenIsDisplayed: () => Promise<boolean>,
    checkFlatListContentInsetScreenIsDisplayed: () => Promise<boolean>,
    checkFlatListInvertedScreenIsDisplayed: () => Promise<boolean>,
    checkSearchBarIsDisplayed: () => Promise<boolean>,
    checkCollapseButtonIsDisplayed: () => Promise<boolean>,
    checkOnStartPizzaIsDisplayed: () => Promise<boolean>,
    checkOnStartIceCreamIsDisplayed: () => Promise<boolean>,
    checkContentInsetMenuIsDisplayed: () => Promise<boolean>,
    checkInvertedToggleFalseButtonIsDisplayed: () => Promise<boolean>,
    clickFlatListBasicButton: () => Promise<void>,
    clickFlatListOnStartButton: () => Promise<void>,
    clickFlatListOnStartTestButton: () => Promise<void>,
    clickFlatListOnEndButton: () => Promise<void>,
    clickFlatListContentInsetButton: () => Promise<void>,
    clickFlatListInvertedButton: () => Promise<void>,
    clickToggleTrueButton: () => Promise<void>,
  };

export const flatListComponentScreen: flatListComponentScreenType = {
    // reference in the Components list
    flatListComponentScreen: Utils.platformSelect({
      ios: iOSLabel('FlatList'),
      android: androidWidget('ViewGroup', 'resource-id', 'FlatList'),
    }),
    // References to elements within the FlatList Component screen
    basicScreenElement: Utils.platformSelect({
      ios: iOSName('Basic'),
      android: androidWidget('TextView', 'text', 'Basic'),
    }),
    onStartReachedScreenElement: Utils.platformSelect({
        ios: iOSName('onStartReached'),
        android: androidWidget('TextView', 'text', 'onStartReached'),
    }),
    onEndReachedScreenElement: Utils.platformSelect({
        ios: iOSName('onEndReached'),
        android: androidWidget('TextView', 'text', 'onEndReached'),
    }),
    contentInsetScreenElement: Utils.platformSelect({
        ios: iOSName('Content Inset'),
        android: androidWidget('TextView', 'text', 'Content Inset'),
      }),
    invertedScreenElement: Utils.platformSelect({
        ios: iOSName('Inverted'),
        android: androidWidget('TextView', 'text', 'Inverted'),
    }),
    btnCollapseElement: Utils.platformSelect({
        ios: iOSLabel('Collapse'),
        android: androidWidget('Button', 'content-desc', 'COLLAPSE'),
    }),
    btnToggleTrueElement: Utils.platformSelect({
        ios: iOSLabel('Toggle true'),
        android: androidWidget('Button', 'content-desc', 'TOGGLE TRUE'),
    }),
    btnToggleFalseElement: Utils.platformSelect({
        ios: iOSLabel('Toggle false'),
        android: androidWidget('Button', 'content-desc', 'TOGGLE FALSE'),
    }),
    basicSearchBarScreenElement: Utils.platformSelect({
        ios: iOSName('search_bar_flat_list'),
        android: androidWidget('EditText', 'resource-id', 'search_bar_flat_list'),
    }),
    onStartBtnTestElement: Utils.platformSelect({
        ios: iOSName('start_test'),
        android: androidWidget('Button', 'resource-id', 'start_test'),
    }),
    onStartPizzaElement: Utils.platformSelect({
        ios: iOSLabel('Pizza'),
        android: androidWidget('TextView', 'text', 'Pizza'),
    }),
    onStartIceCreamElement: Utils.platformSelect({
        ios: iOSLabel('Ice Cream'),
        android: androidWidget('TextView', 'text', 'Ice Cream'),
    }),
    contentInsetMenuElement: Utils.platformSelect({
        ios: iOSLabel('Menu'),
        android: androidWidget('TextView', 'text', 'Menu'),
    }),
    // Methods to interact with the elements
    checkSearchBarIsDisplayed: async function (
      this: flatListComponentScreenType,
    ): Promise<boolean> {
      return await Utils.checkElementExistence(this.basicSearchBarScreenElement);
    },
    checkCollapseButtonIsDisplayed: async function (
        this: flatListComponentScreenType,
      ): Promise<boolean> {
        return await Utils.checkElementExistence(this.btnCollapseElement);
      },
    checkFlatListBasicScreenIsDisplayed: async function (
        this: flatListComponentScreenType,
      ): Promise<boolean> {
        return await Utils.checkElementExistence(this.basicScreenElement);
    },
    checkFlatListOnStartReachedScreenIsDisplayed: async function (
        this: flatListComponentScreenType,
      ): Promise<boolean> {
        return await Utils.checkElementExistence(this.onStartReachedScreenElement);
    },
    checkFlatListOnEndReachedScreenIsDisplayed: async function (
        this: flatListComponentScreenType,
      ): Promise<boolean> {
        return await Utils.checkElementExistence(this.onEndReachedScreenElement);
    },
    checkOnStartPizzaIsDisplayed: async function (
        this: flatListComponentScreenType,
      ): Promise<boolean> {
        return await Utils.checkElementExistence(this.onStartPizzaElement);
    },
    checkOnStartIceCreamIsDisplayed: async function (
        this: flatListComponentScreenType,
      ): Promise<boolean> {
        return await Utils.checkElementExistence(this.onStartIceCreamElement);
    },
    checkFlatListContentInsetScreenIsDisplayed: async function (
        this: flatListComponentScreenType,
      ): Promise<boolean> {
        return await Utils.checkElementExistence(this.contentInsetScreenElement);
    },
    checkContentInsetMenuIsDisplayed: async function (
        this: flatListComponentScreenType,
      ): Promise<boolean> {
        return await Utils.checkElementExistence(this.contentInsetMenuElement);
    },
    checkFlatListInvertedScreenIsDisplayed: async function (
        this: flatListComponentScreenType,
      ): Promise<boolean> {
        return await Utils.checkElementExistence(this.invertedScreenElement);
    },
    checkInvertedToggleFalseButtonIsDisplayed: async function (
        this: flatListComponentScreenType,
      ): Promise<boolean> {
        return await Utils.checkElementExistence(this.btnToggleFalseElement);
    },
    clickFlatListBasicButton: async function (
        this: flatListComponentScreenType,
      ): Promise<void> {
        await Utils.clickElement(this.basicScreenElement);
    },
    clickFlatListOnStartButton: async function (
        this: flatListComponentScreenType,
      ): Promise<void> {
        await Utils.clickElement(this.onStartReachedScreenElement);
    },
    clickFlatListOnStartTestButton: async function (
        this: flatListComponentScreenType,
      ): Promise<void> {
        await Utils.clickElement(this.onStartBtnTestElement);
    },
    clickFlatListOnEndButton: async function (
        this: flatListComponentScreenType,
      ): Promise<void> {
        await Utils.clickElement(this.onEndReachedScreenElement);
    },
    clickFlatListContentInsetButton: async function (
        this: flatListComponentScreenType,
      ): Promise<void> {
        await Utils.clickElement(this.contentInsetScreenElement);
    },
    clickFlatListInvertedButton: async function (
        this: flatListComponentScreenType,
      ): Promise<void> {
        await Utils.clickElement(this.invertedScreenElement);
    },
    clickToggleTrueButton: async function (
        this: flatListComponentScreenType,
      ): Promise<void> {
        await Utils.clickElement(this.btnToggleTrueElement);
    },
};
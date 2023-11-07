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
  iOSLabel,
  androidWidget,
  iOSName,
} from '../../helpers/utils';

type FlatListComponentScreenType = {
  flatListScreenElement: string,
  basicScreenElement: string,
  onStartReachedScreenElement: string,
  onEndReachedScreenElement: string,
  contentInsetScreenElement: string,
  invertedScreenElement: string,
  onViewableItemsChangedScreenElement: string,
  flatListWithSeparatorsScreenElement: string,
  multiColumnScreenElement: string,
  stickyHeadersScreenElement: string,
  nestedScreenElement: string,
  basicSearchBarScreenElement: string,
  btnCollapseElement: string,
  btnToggleTrueElement: string,
  btnToggleFalseElement: string,
  onStartBtnTestElement: string,
  stickyPizzaElement: string,
  pizzaElement: string,
  iceCreamElement: string,
  contentInsetMenuElement: string,
  separatorElement: string,
  listHeaderTextElement: string,
  nestedHeaderTextElement: string,
  checkFlatListBasicScreenIsDisplayed: () => Promise<boolean>,
  checkFlatListOnStartReachedScreenIsDisplayed: () => Promise<boolean>,
  checkFlatListOnEndReachedScreenIsDisplayed: () => Promise<boolean>,
  checkFlatListContentInsetScreenIsDisplayed: () => Promise<boolean>,
  checkFlatListInvertedScreenIsDisplayed: () => Promise<boolean>,
  checkFlatListOnViewableItemsChangedScreenIsDisplayed: () => Promise<boolean>,
  checkFlatListWithSeparatorsScreenIsDisplayed: () => Promise<boolean>,
  checkFlatListMultiColumnScreenIsDisplayed: () => Promise<boolean>,
  checkFlatListStickyHeadersScreenIsDisplayed: () => Promise<boolean>,
  checkFlatListNestedScreenIsDisplayed: () => Promise<boolean>,
  checkSearchBarIsDisplayed: () => Promise<boolean>,
  checkCollapseButtonIsDisplayed: () => Promise<boolean>,
  checkPizzaIsDisplayed: () => Promise<boolean>,
  checkIceCreamIsDisplayed: () => Promise<boolean>,
  checkContentInsetMenuIsDisplayed: () => Promise<boolean>,
  checkInvertedToggleFalseButtonIsDisplayed: () => Promise<boolean>,
  checkSeparatorIsDisplayed: () => Promise<boolean>,
  checkListHeaderIsDisplayed: () => Promise<boolean>,
  checkStickyPizzaIsDisplayed: () => Promise<boolean>,
  checkNestedHeaderIsDisplayed: () => Promise<boolean>,
  scrollUntilOnViewableItemsChangedIsDisplayed: () => Promise<void>,
  scrollUntilNestedIsDisplayed: () => Promise<void>,
  clickFlatListBasicButton: () => Promise<void>,
  clickFlatListOnStartButton: () => Promise<void>,
  clickFlatListOnStartTestButton: () => Promise<void>,
  clickFlatListOnEndButton: () => Promise<void>,
  clickFlatListContentInsetButton: () => Promise<void>,
  clickFlatListInvertedButton: () => Promise<void>,
  clickFlatListOnViewableItemsChangedButton: () => Promise<void>,
  clickFlatListWithSeparatorsButton: () => Promise<void>,
  clickFlatListMultiColumnButton: () => Promise<void>,
  clickFlatListStickyHeadersButton: () => Promise<void>,
  clickFlatListNestedButton: () => Promise<void>,
  clickToggleTrueButton: () => Promise<void>,
};
const flatListWithSeparatorsText = 'FlatList with Separators';

export const FlatListComponentScreen: FlatListComponentScreenType = {
  // reference in the Components list
  flatListScreenElement: Utils.platformSelect({
    ios: iOSName('FlatList'),
    android: androidWidget('TextView', 'text', 'FlatList'),
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
  onViewableItemsChangedScreenElement: Utils.platformSelect({
    ios: iOSName('onViewableItemsChanged'),
    android: androidWidget('TextView', 'text', 'onViewableItemsChanged'),
  }),
  flatListWithSeparatorsScreenElement: Utils.platformSelect({
    ios: iOSName(flatListWithSeparatorsText),
    android: androidWidget('TextView', 'text', flatListWithSeparatorsText),
  }),
  multiColumnScreenElement: Utils.platformSelect({
    ios: iOSName('MultiColumn'),
    android: androidWidget('TextView', 'text', 'MultiColumn'),
  }),
  stickyHeadersScreenElement: Utils.platformSelect({
    ios: iOSName('Sticky Headers'),
    android: androidWidget('TextView', 'text', 'Sticky Headers'),
  }),
  nestedScreenElement: Utils.platformSelect({
    ios: iOSName('Nested'),
    android: androidWidget('TextView', 'text', 'Nested'),
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
  pizzaElement: Utils.platformSelect({
    ios: iOSLabel('Pizza'),
    android: androidWidget('TextView', 'text', 'Pizza'),
  }),
  iceCreamElement: Utils.platformSelect({
    ios: iOSLabel('Ice Cream'),
    android: androidWidget('TextView', 'text', 'Ice Cream'),
  }),
  contentInsetMenuElement: Utils.platformSelect({
    ios: iOSLabel('Menu'),
    android: androidWidget('TextView', 'text', 'Menu'),
  }),
  separatorElement: Utils.platformSelect({
    ios: iOSName('flat_list_separator'),
    android: androidWidget('TextView', 'resource-id', 'flat_list_separator'),
  }),
  listHeaderTextElement: Utils.platformSelect({
    ios: iOSName('LIST HEADER'),
    android: androidWidget('TextView', 'text', 'LIST HEADER'),
  }),
  stickyPizzaElement: Utils.platformSelect({
    ios: iOSName('Sticky Pizza'),
    android: androidWidget('TextView', 'text', 'Sticky Pizza'),
  }),
  nestedHeaderTextElement: Utils.platformSelect({
    ios: iOSName('Header'),
    android: androidWidget('TextView', 'text', 'Header'),
  }),
  // Methods to interact with the FlatList elements
  checkSearchBarIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.basicSearchBarScreenElement);
  },
  checkCollapseButtonIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.btnCollapseElement);
  },
  checkFlatListBasicScreenIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.basicScreenElement);
  },
  checkFlatListOnStartReachedScreenIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.onStartReachedScreenElement);
  },
  checkFlatListOnEndReachedScreenIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.onEndReachedScreenElement);
  },
  checkPizzaIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.pizzaElement);
  },
  checkIceCreamIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.iceCreamElement);
  },
  checkFlatListContentInsetScreenIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.contentInsetScreenElement);
  },
  checkFlatListInvertedScreenIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.invertedScreenElement);
  },
  checkFlatListOnViewableItemsChangedScreenIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(
      this.onViewableItemsChangedScreenElement,
    );
  },
  checkFlatListWithSeparatorsScreenIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(
      this.flatListWithSeparatorsScreenElement,
    );
  },
  checkFlatListMultiColumnScreenIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.multiColumnScreenElement);
  },
  checkFlatListStickyHeadersScreenIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.stickyHeadersScreenElement);
  },
  checkFlatListNestedScreenIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.nestedScreenElement);
  },
  checkListHeaderIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.listHeaderTextElement);
  },
  checkContentInsetMenuIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.contentInsetMenuElement);
  },
  checkInvertedToggleFalseButtonIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.btnToggleFalseElement);
  },
  checkSeparatorIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.separatorElement);
  },
  checkStickyPizzaIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.stickyPizzaElement);
  },
  checkNestedHeaderIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<boolean> {
    return await Utils.checkElementExistence(this.nestedHeaderTextElement);
  },
  scrollUntilOnViewableItemsChangedIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    return await Utils.scrollToElement(
      this.onViewableItemsChangedScreenElement,
    );
  },
  scrollUntilNestedIsDisplayed: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    return await Utils.scrollToElement(this.nestedScreenElement);
  },
  clickFlatListBasicButton: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.basicScreenElement);
  },
  clickFlatListOnStartButton: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.onStartReachedScreenElement);
  },
  clickFlatListOnStartTestButton: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.onStartBtnTestElement);
  },
  clickFlatListOnEndButton: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.onEndReachedScreenElement);
  },
  clickFlatListContentInsetButton: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.contentInsetScreenElement);
  },
  clickFlatListInvertedButton: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.invertedScreenElement);
  },
  clickFlatListOnViewableItemsChangedButton: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.onViewableItemsChangedScreenElement);
  },
  clickFlatListWithSeparatorsButton: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.flatListWithSeparatorsScreenElement);
  },
  clickFlatListMultiColumnButton: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.multiColumnScreenElement);
  },
  clickFlatListStickyHeadersButton: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.stickyHeadersScreenElement);
  },
  clickFlatListNestedButton: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.nestedScreenElement);
  },
  clickToggleTrueButton: async function (
    this: FlatListComponentScreenType,
  ): Promise<void> {
    await Utils.clickElement(this.btnToggleTrueElement);
  },
};

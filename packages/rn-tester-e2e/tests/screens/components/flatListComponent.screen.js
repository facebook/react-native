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
    btnToogleFalseElement: string,
    onStartBtnTestElement: string,
    onStartPizzaElement: string,
    onStartIceCreamElement: string,
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
    checkOnStartPizzaIsDisplayed: () => Promise<boolean>,
    checkOnStartIceCreamIsDisplayed: () => Promise<boolean>,
    checkContentInsetMenuIsDisplayed: () => Promise<boolean>,
    checkInvertedToggleFalseButtonIsDisplayed: () => Promise<boolean>,
    checkSeparatorIsDisplayed: () => Promise<boolean>,
    checkListHeaderIsDisplayed: () => Promise<boolean>,
    checkStickyPizzaIsDisplayed: () => Promise<boolean>,
    checkNestedHeaderIsDisplayed: () => Promise<boolean>,
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

export const FlatListComponentScreen: FlatListComponentScreenType = {
    // reference in the Components list
    flatListComponentScreenElement: Utils.platformSelect({
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
    onViewableItemsChangedScreenElement: Utils.platformSelect({
      ios: iOSName('onViewableItemsChanged'),
      android: androidWidget('TextView', 'text', 'onViewableItemsChanged'),
    }),
    flatListWithSeparatorsScreenElement: Utils.platformSelect({
      ios: iOSName('FlatList with Separators'),
      android: androidWidget('TextView', 'text', 'FlatList with Separators'),
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
    separatorElement: Utils.platformSelect({
      ios: iOSName('flat-list-separator'),
      android: androidWidget('TextView', 'resource-id', 'flat-list-separator'),
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
    // Methods to interact with the elements
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
    checkOnStartPizzaIsDisplayed: async function (
        this: FlatListComponentScreenType,
      ): Promise<boolean> {
        return await Utils.checkElementExistence(this.onStartPizzaElement);
    },
    checkOnStartIceCreamIsDisplayed: async function (
        this: FlatListComponentScreenType,
      ): Promise<boolean> {
        return await Utils.checkElementExistence(this.onStartIceCreamElement);
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
      return await Utils.checkElementExistence(this.onViewableItemsChangedScreenElement);
    },
    checkFlatListWithSeparatorsScreenIsDisplayed: async function (
      this: FlatListComponentScreenType,
    ): Promise<boolean> {
      return await Utils.checkElementExistence(this.flatListWithSeparatorsScreenElement);
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
    checkFlatListInvertedScreenIsDisplayed: async function (
        this: FlatListComponentScreenType,
      ): Promise<boolean> {
        return await Utils.checkElementExistence(this.invertedScreenElement);
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
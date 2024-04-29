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
  FlatListComponentScreen,
} = require('../../screens/components/flatListComponent.screen.js');

describe('Test is checking basic flat list', () => {
  test('Should view properly search bar of basic flat list', async () => {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    expect(
      await FlatListComponentScreen.checkFlatListBasicScreenIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListBasicButton();
    expect(
      await FlatListComponentScreen.checkSearchBarIsDisplayed(),
    ).toBeTruthy();
  });
});

describe('Test is checking onStartReached flat list', () => {
  test('Should view properly first element', async () => {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    expect(
      await FlatListComponentScreen.checkFlatListOnStartReachedScreenIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListOnStartButton();
    expect(
      await FlatListComponentScreen.checkCollapseButtonIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListOnStartTestButton();
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
  });
});

describe('Test is checking onEndReached flat list', () => {
  test('Should view properly the last element', async () => {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    expect(
      await FlatListComponentScreen.checkFlatListOnEndReachedScreenIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListOnEndButton();
    expect(
      await FlatListComponentScreen.checkCollapseButtonIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListOnStartTestButton();
    expect(
      await FlatListComponentScreen.checkIceCreamIsDisplayed(),
    ).toBeTruthy();
  });
});

describe('Test is checking content inset flat list', () => {
  test('Should view properly the menu element', async () => {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    expect(
      await FlatListComponentScreen.checkFlatListContentInsetScreenIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListContentInsetButton();
    expect(
      await FlatListComponentScreen.checkCollapseButtonIsDisplayed(),
    ).toBeTruthy();
    expect(
      await FlatListComponentScreen.checkContentInsetMenuIsDisplayed(),
    ).toBeTruthy();
  });
});

describe('Test is checking inverted flat list', () => {
  test('Should view properly the menu element', async () => {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    await FlatListComponentScreen.scrollUntilOnViewableItemsChangedIsDisplayed();
    expect(
      await FlatListComponentScreen.checkFlatListInvertedScreenIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListInvertedButton();
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
    await FlatListComponentScreen.clickToggleTrueButton();
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
  });
});

describe('Test is checking onViewableItemsChanges component', () => {
  test('Should view properly the pizza element', async () => {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    await FlatListComponentScreen.scrollUntilOnViewableItemsChangedIsDisplayed();
    expect(
      await FlatListComponentScreen.checkFlatListOnViewableItemsChangedScreenIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListOnViewableItemsChangedButton();
    expect(await FlatListComponentScreen.checkPizzaIsDisplayed()).toBeTruthy();
  });
});

describe('Test is checking FlatList with Separators component', () => {
  test('Should view properly the separator element', async () => {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    await FlatListComponentScreen.scrollUntilNestedIsDisplayed();
    expect(
      await FlatListComponentScreen.checkFlatListWithSeparatorsScreenIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListWithSeparatorsButton();
    expect(
      await FlatListComponentScreen.checkSeparatorIsDisplayed(),
    ).toBeTruthy();
  });
});

describe('Test is checking multicolumn component', () => {
  test('Should view properly the list header element', async () => {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    await FlatListComponentScreen.scrollUntilNestedIsDisplayed();
    expect(
      await FlatListComponentScreen.checkFlatListMultiColumnScreenIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListMultiColumnButton();
    expect(
      await FlatListComponentScreen.checkListHeaderIsDisplayed(),
    ).toBeTruthy();
  });
});

describe('Test is checking sticky headers component', () => {
  test('Should view properly the sticky pizza element', async () => {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    await FlatListComponentScreen.scrollUntilNestedIsDisplayed();
    expect(
      await FlatListComponentScreen.checkFlatListStickyHeadersScreenIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListStickyHeadersButton();
    expect(
      await FlatListComponentScreen.checkStickyPizzaIsDisplayed(),
    ).toBeTruthy();
  });
});

describe('Test is checking nested component', () => {
  test('Should view properly the nested header element', async () => {
    expect(
      await ComponentsScreen.checkFlatListComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickFlatListComponent();
    await FlatListComponentScreen.scrollUntilNestedIsDisplayed();
    expect(
      await FlatListComponentScreen.checkFlatListNestedScreenIsDisplayed(),
    ).toBeTruthy();
    await FlatListComponentScreen.clickFlatListNestedButton();
    expect(
      await FlatListComponentScreen.checkNestedHeaderIsDisplayed(),
    ).toBeTruthy();
  });
});

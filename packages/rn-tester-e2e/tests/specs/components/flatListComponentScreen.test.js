/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const { ComponentsScreen } = require('../../screens/components.screen.js');
const { FlatListComponentScreen, flatListComponentScreen } = require('../../screens/components/flatListComponent.screen.js');

describe('Test is checking basic flat list', () => {
    test('Should view properly search bar of basic flat list', async () => {
        expect(
            await ComponentsScreen.checkFlatListComponentIsDisplayed(),
        ).toBeTruthy();
        await ComponentsScreen.clickFlatListComponent();
        expect(
            await flatListComponentScreen.checkFlatListBasicScreenIsDisplayed(),
        ).toBeTruthy();
        await flatListComponentScreen.clickFlatListBasicButton();
        expect(
            await flatListComponentScreen.checkSearchBarIsDisplayed(),
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
            await flatListComponentScreen.checkFlatListOnStartReachedScreenIsDisplayed(),
        ).toBeTruthy();
        await flatListComponentScreen.clickFlatListOnStartButton();
        expect(
            await flatListComponentScreen.checkCollapseButtonIsDisplayed(),
        ).toBeTruthy();
        await flatListComponentScreen.clickFlatListOnStartTestButton();
        expect(
            await flatListComponentScreen.checkOnStartPizzaIsDisplayed(),
        ).toBeTruthy();
    });
});

describe('Test is checking onEndReached flat list', () => {
    test('Should view properly the last element', async () => {
        expect(
            await ComponentsScreen.checkFlatListComponentIsDisplayed(),
        ).toBeTruthy();
        await ComponentsScreen.clickFlatListComponent();
        expect(
            await flatListComponentScreen.checkFlatListOnEndReachedScreenIsDisplayed(),
        ).toBeTruthy();
        await flatListComponentScreen.clickFlatListOnEndButton();
        expect(
            await flatListComponentScreen.checkCollapseButtonIsDisplayed(),
        ).toBeTruthy();
        await flatListComponentScreen.clickFlatListOnStartTestButton();
        expect(
            await flatListComponentScreen.checkOnStartIceCreamIsDisplayed(),
        ).toBeTruthy();
    });
});

describe('Test is checking onEndReached flat list', () => {
    test('Should view properly the last element', async () => {
        expect(
            await ComponentsScreen.checkFlatListComponentIsDisplayed(),
        ).toBeTruthy();
        await ComponentsScreen.clickFlatListComponent();
        expect(
            await flatListComponentScreen.checkFlatListOnEndReachedScreenIsDisplayed(),
        ).toBeTruthy();
        await flatListComponentScreen.clickFlatListOnEndButton();
        expect(
            await flatListComponentScreen.checkCollapseButtonIsDisplayed(),
        ).toBeTruthy();
        await flatListComponentScreen.clickFlatListOnStartTestButton();
        expect(
            await flatListComponentScreen.checkOnStartIceCreamIsDisplayed(),
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
            await flatListComponentScreen.checkFlatListContentInsetScreenIsDisplayed(),
        ).toBeTruthy();
        await flatListComponentScreen.clickFlatListContentInsetButton();
        expect(
            await flatListComponentScreen.checkCollapseButtonIsDisplayed(),
        ).toBeTruthy();
        expect(
            await flatListComponentScreen.checkContentInsetMenuIsDisplayed(),
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
            await flatListComponentScreen.checkFlatListInvertedScreenIsDisplayed(),
        ).toBeTruthy();
        await flatListComponentScreen.clickFlatListInvertedButton();
        expect(
            await flatListComponentScreen.checkOnStartPizzaIsDisplayed(),
        ).toBeTruthy();
        await flatListComponentScreen.clickToggleTrueButton();
        expect(
            await flatListComponentScreen.checkOnStartPizzaIsDisplayed(),
        ).toBeTruthy();
    });
});
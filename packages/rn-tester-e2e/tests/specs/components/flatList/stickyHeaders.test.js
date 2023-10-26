/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

 const {ComponentsScreen} = require('../../../screens/components.screen.js');
 const {
   FlatListComponentScreen,
 } = require('../../../screens/components/flatListComponent.screen.js');
 
 describe('Test is checking sticky headers component', function()  {
   it('Should view properly the sticky pizza element', async function() {
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
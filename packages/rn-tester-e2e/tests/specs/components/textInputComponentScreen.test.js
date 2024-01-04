/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {ComponentsScreen} = require('../../screens/components.screen.js');
const {
  TextInputComponentScreen,
} = require('../../screens/components/textInputComponent.screen.js');

const isIOS = (process?.env?.E2E_DEVICE || 'ios') === 'ios';

describe('Test is checking text replacement', () => {
  test('Should replace properly space by underscore', async () => {
    await TextInputComponentScreen.scrollUntilTextInputComponentIsDisplayed();
    expect(
      await ComponentsScreen.checkTextInputComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickTextInputComponent();
    expect(await TextInputComponentScreen.checkTextIsReWrited()).toEqual(
      'foo_space_replace',
    );
  });
  test('Should replace properly space by underscore and limit character amount', async () => {
    await TextInputComponentScreen.scrollUntilTextInputComponentIsDisplayed();
    expect(
      await ComponentsScreen.checkTextInputComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickTextInputComponent();
    expect(await TextInputComponentScreen.checkLongTextIsReWrited()).toEqual(
      'foobars_space_replac',
    );
  });

  test('Should remove all spaces ', async () => {
    await TextInputComponentScreen.scrollUntilTextInputComponentIsDisplayed();
    expect(
      await ComponentsScreen.checkTextInputComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickTextInputComponent();
    await TextInputComponentScreen.scrollToTextNoSpaceAllowElement();
    expect(await TextInputComponentScreen.checkNoSpaceAllowed()).toEqual(
      'foobarnospacetest',
    );
  });
});

describe('Test is clearing text by Button', () => {
  test('Should remove properly the text when clear button clicked', async () => {
    await TextInputComponentScreen.scrollUntilTextInputComponentIsDisplayed();
    expect(
      await ComponentsScreen.checkTextInputComponentIsDisplayed(),
    ).toBeTruthy();
    await ComponentsScreen.clickTextInputComponent();
    await TextInputComponentScreen.scrollToTextAndClearButtonElement();
    expect(await TextInputComponentScreen.checkAddTextAndClearButton()).toEqual(
      '',
    );
  });
});

if (isIOS) {
  describe('Test double space to dot', () => {
    test('Should replace to dot in a Controlled TextInput', async () => {
      await TextInputComponentScreen.scrollUntilTextInputComponentIsDisplayed();
      expect(
        await ComponentsScreen.checkTextInputComponentIsDisplayed(),
      ).toBeTruthy();
      await ComponentsScreen.clickTextInputComponent();
      await TextInputComponentScreen.scrollToDoubleSpaceElement();
      expect(
        await TextInputComponentScreen.checkDoubleSpaceControlledTextInput(),
      ).toEqual('testing. ');
    });
  });
}

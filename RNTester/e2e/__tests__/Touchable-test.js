/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 */

/* global element, by, expect */

describe('Touchable', () => {
  beforeAll(async () => {
    await element(by.id('explorer_search')).replaceText('<Touchable*');
    await element(
      by.label('<Touchable*> and onPress Touchable and onPress examples.'),
    ).tap();
  });

  afterAll(async () => {
    //TODO - remove app state persistency, till then, we must go back to main screen,
    await element(by.label('Back')).tap();
  });

  it('Touchable Highlight should be tappable', async () => {
    await element(by.id('example_search')).replaceText('<TouchableHighlight>');
    const buttonID = 'touchable_highlight_image_button';
    const button2ID = 'touchable_highlight_text_button';
    const consoleID = 'touchable_highlight_console';

    await element(by.id(buttonID)).tap();
    await expect(element(by.id(consoleID))).toHaveText(
      'TouchableHighlight onPress',
    );

    await element(by.id(buttonID)).tap();
    await expect(element(by.id(consoleID))).toHaveText(
      '2x TouchableHighlight onPress',
    );

    await element(by.id(button2ID)).tap();
    await expect(element(by.id(consoleID))).toHaveText(
      '3x TouchableHighlight onPress',
    );
  });

  it('Touchable Without Feedback should be tappable', async () => {
    await element(by.id('example_search')).replaceText(
      '<TouchableWithoutFeedback>',
    );
    const buttonID = 'touchable_without_feedback_button';
    const consoleID = 'touchable_without_feedback_console';

    await element(by.id(buttonID)).tap();
    await expect(element(by.id(consoleID))).toHaveText(
      'TouchableWithoutFeedback onPress',
    );

    await element(by.id(buttonID)).tap();
    await expect(element(by.id(consoleID))).toHaveText(
      '2x TouchableWithoutFeedback onPress',
    );
  });

  it('Text should be tappable', async () => {
    await element(by.id('example_search')).replaceText(
      '<Text onPress={fn}> with highlight',
    );
    const buttonID = 'tappable_text';
    const consoleID = 'tappable_text_console';

    await element(by.id(buttonID)).tap();
    await expect(element(by.id(consoleID))).toHaveText('text onPress');

    await element(by.id(buttonID)).tap();
    await expect(element(by.id(consoleID))).toHaveText('2x text onPress');
  });
});

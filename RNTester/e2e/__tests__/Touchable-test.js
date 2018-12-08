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
    await element(by.id('touchable_highlight_image_button')).tap();
    await expect(element(by.id('touchable_highlight_console'))).toHaveText(
      'TouchableHighlight onPress',
    );
  });

  it('Touchable Without Feedback should be tappable', async () => {
    await element(by.label('Tap Here For No Feedback!')).tap();
    await expect(
      element(by.text('TouchableWithoutFeedback onPress')),
    ).toBeVisible();
  });

  it('Text should be tappable', async () => {
    await element(by.text('Text has built-in onPress handling')).tap();
    await expect(element(by.text('text onPress'))).toBeVisible();
  });
});

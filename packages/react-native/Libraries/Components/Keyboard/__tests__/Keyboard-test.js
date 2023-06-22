/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

const LayoutAnimation = require('../../../LayoutAnimation/LayoutAnimation');
const dismissKeyboard = require('../../../Utilities/dismissKeyboard');
const Keyboard = require('../Keyboard');

jest.mock('../../../LayoutAnimation/LayoutAnimation');
jest.mock('../../../Utilities/dismissKeyboard');

describe('Keyboard', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('uses dismissKeyboard utility', () => {
    Keyboard.dismiss();
    expect(dismissKeyboard).toHaveBeenCalled();
  });

  describe('scheduling layout animation', () => {
    const scheduleLayoutAnimation = (
      duration: null | number,
      easing:
        | null
        | $TEMPORARY$string<'linear'>
        | $TEMPORARY$string<'some-unknown-animation-type'>
        | $TEMPORARY$string<'spring'>,
    ): void =>
      // $FlowFixMe[incompatible-call]
      Keyboard.scheduleLayoutAnimation({duration, easing});

    test('triggers layout animation', () => {
      scheduleLayoutAnimation(12, 'spring');
      expect(LayoutAnimation.configureNext).toHaveBeenCalledWith({
        duration: 12,
        update: {
          duration: 12,
          type: 'spring',
        },
      });
    });

    test('does not trigger animation when duration is null', () => {
      scheduleLayoutAnimation(null, 'spring');
      expect(LayoutAnimation.configureNext).not.toHaveBeenCalled();
    });

    test('does not trigger animation when duration is 0', () => {
      scheduleLayoutAnimation(0, 'spring');
      expect(LayoutAnimation.configureNext).not.toHaveBeenCalled();
    });

    describe('animation update type', () => {
      const assertAnimationUpdateType = (
        type: $TEMPORARY$string<'keyboard'> | $TEMPORARY$string<'linear'>,
      ) =>
        expect(LayoutAnimation.configureNext).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: expect.anything(),
            update: {duration: expect.anything(), type},
          }),
        );

      test('retrieves type from LayoutAnimation', () => {
        scheduleLayoutAnimation(12, 'linear');
        assertAnimationUpdateType('linear');
      });

      test("defaults to 'keyboard' when key in LayoutAnimation is not found", () => {
        scheduleLayoutAnimation(12, 'some-unknown-animation-type');
        assertAnimationUpdateType('keyboard');
      });

      test("defaults to 'keyboard' when easing is null", () => {
        scheduleLayoutAnimation(12, null);
        assertAnimationUpdateType('keyboard');
      });
    });
  });
});

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @emails oncall+react_native
 */

'use strict';

const Keyboard = require('../Keyboard');
const dismissKeyboard = require('../../../Utilities/dismissKeyboard');
const LayoutAnimation = require('../../../LayoutAnimation/LayoutAnimation');

const NativeEventEmitter = require('../../../EventEmitter/NativeEventEmitter');
const NativeModules = require('../../../BatchedBridge/NativeModules');

jest.mock('../../../LayoutAnimation/LayoutAnimation');

describe('Keyboard', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('exposes KeyboardEventEmitter methods', () => {
    const KeyboardObserver = NativeModules.KeyboardObserver;
    const KeyboardEventEmitter = new NativeEventEmitter(KeyboardObserver);

    // $FlowFixMe
    expect(Keyboard._subscriber).toBe(KeyboardEventEmitter._subscriber);
    expect(Keyboard._nativeModule).toBe(KeyboardEventEmitter._nativeModule);
  });

  it('uses dismissKeyboard utility', () => {
    expect(Keyboard.dismiss).toBe(dismissKeyboard);
  });

  describe('scheduling layout animation', () => {
    const scheduleLayoutAnimation = (
      duration: number | null,
      easing: string | null,
    ): void => Keyboard.scheduleLayoutAnimation({duration, easing});

    it('triggers layout animation', () => {
      scheduleLayoutAnimation(12, 'spring');
      expect(LayoutAnimation.configureNext).toHaveBeenCalledWith({
        duration: 12,
        update: {
          duration: 12,
          type: 'spring',
        },
      });
    });

    it('does not trigger animation when duration is null', () => {
      scheduleLayoutAnimation(null, 'spring');
      expect(LayoutAnimation.configureNext).not.toHaveBeenCalled();
    });

    it('does not trigger animation when duration is 0', () => {
      scheduleLayoutAnimation(0, 'spring');
      expect(LayoutAnimation.configureNext).not.toHaveBeenCalled();
    });

    describe('animation update type', () => {
      const assertAnimationUpdateType = type =>
        expect(LayoutAnimation.configureNext).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: expect.anything(),
            update: {duration: expect.anything(), type},
          }),
        );

      it('retrieves type from LayoutAnimation', () => {
        scheduleLayoutAnimation(12, 'linear');
        assertAnimationUpdateType('linear');
      });

      it("defaults to 'keyboard' when key in LayoutAnimation is not found", () => {
        scheduleLayoutAnimation(12, 'some-unknown-animation-type');
        assertAnimationUpdateType('keyboard');
      });

      it("defaults to 'keyboard' when easing is null", () => {
        scheduleLayoutAnimation(12, null);
        assertAnimationUpdateType('keyboard');
      });
    });
  });
});

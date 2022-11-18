/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

const StyleSheet = require('../../StyleSheet/StyleSheet');
let Animated = require('../Animated').default;
let AnimatedProps = require('../nodes/AnimatedProps').default;

jest.mock('../../Utilities/Platform', () => {
  return {OS: 'web'};
});

describe('Animated tests', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Animated', () => {
    it('works end to end', () => {
      const anim = new Animated.Value(0);
      const translateAnim = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [100, 200],
      });

      const callback = jest.fn();

      const node = new AnimatedProps(
        {
          style: {
            backgroundColor: 'red',
            opacity: anim,
            transform: [
              {
                translate: [translateAnim, translateAnim],
              },
              {
                translateX: translateAnim,
              },
              {scale: anim},
            ],
            shadowOffset: {
              width: anim,
              height: anim,
            },
          },
        },
        callback,
      );

      expect(node.__getValue()).toEqual({
        style: [
          {
            backgroundColor: 'red',
            opacity: anim,
            shadowOffset: {
              width: anim,
              height: anim,
            },
            transform: [
              {translate: [translateAnim, translateAnim]},
              {translateX: translateAnim},
              {scale: anim},
            ],
          },
          {
            opacity: 0,
            transform: [{translate: [100, 100]}, {translateX: 100}, {scale: 0}],
            shadowOffset: {
              width: 0,
              height: 0,
            },
          },
        ],
      });

      expect(anim.__getChildren().length).toBe(0);

      node.__attach();

      expect(anim.__getChildren().length).toBe(3);

      anim.setValue(0.5);

      expect(callback).toBeCalled();

      expect(node.__getValue()).toEqual({
        style: [
          {
            backgroundColor: 'red',
            opacity: anim,
            shadowOffset: {
              width: anim,
              height: anim,
            },
            transform: [
              {translate: [translateAnim, translateAnim]},
              {translateX: translateAnim},
              {scale: anim},
            ],
          },
          {
            opacity: 0.5,
            transform: [
              {translate: [150, 150]},
              {translateX: 150},
              {scale: 0.5},
            ],
            shadowOffset: {
              width: 0.5,
              height: 0.5,
            },
          },
        ],
      });

      node.__detach();
      expect(anim.__getChildren().length).toBe(0);

      anim.setValue(1);
      expect(callback.mock.calls.length).toBe(1);
    });

    /**
     * The behavior matters when the input style is a mix of values
     * from StyleSheet.create and an inline style with an animation
     */
    it('does not discard initial style', () => {
      const value1 = new Animated.Value(1);
      const scale = value1.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2],
      });
      const callback = jest.fn();
      const node = new AnimatedProps(
        {
          style: [
            styles.red,
            {
              transform: [
                {
                  scale,
                },
              ],
            },
          ],
        },
        callback,
      );

      expect(node.__getValue()).toEqual({
        style: [
          [
            styles.red,
            {
              transform: [{scale}],
            },
          ],
          {
            transform: [{scale: 2}],
          },
        ],
      });

      node.__attach();
      expect(callback.mock.calls.length).toBe(0);
      value1.setValue(0.5);
      expect(callback.mock.calls.length).toBe(1);
      expect(node.__getValue()).toEqual({
        style: [
          [
            styles.red,
            {
              transform: [{scale}],
            },
          ],
          {
            transform: [{scale: 1.5}],
          },
        ],
      });

      node.__detach();
    });
  });
});

const styles = StyleSheet.create({
  red: {
    backgroundColor: 'red',
  },
});

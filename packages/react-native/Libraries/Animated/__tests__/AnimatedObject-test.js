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

import Animated from '../Animated';
import AnimatedObject, {hasAnimatedNode} from '../nodes/AnimatedObject';

describe('AnimatedObject', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should get the proper value', () => {
    const anim = new Animated.Value(0);
    const translateAnim = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 200],
    });

    const node = new AnimatedObject([
      {
        translate: [translateAnim, translateAnim],
      },
      {
        translateX: translateAnim,
      },
      {scale: anim},
    ]);

    expect(node.__getValue()).toEqual([
      {translate: [100, 100]},
      {translateX: 100},
      {scale: 0},
    ]);
  });

  it('should make all AnimatedNodes native', () => {
    const anim = new Animated.Value(0);
    const translateAnim = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 200],
    });

    const node = new AnimatedObject([
      {
        translate: [translateAnim, translateAnim],
      },
      {
        translateX: translateAnim,
      },
      {scale: anim},
    ]);

    node.__makeNative();

    expect(node.__isNative).toBe(true);
    expect(anim.__isNative).toBe(true);
    expect(translateAnim.__isNative).toBe(true);
  });

  describe('hasAnimatedNode', () => {
    it('should detect any animated nodes', () => {
      expect(hasAnimatedNode(10)).toBe(false);

      const anim = new Animated.Value(0);
      expect(hasAnimatedNode(anim)).toBe(true);

      const event = Animated.event([{}], {useNativeDriver: true});
      expect(hasAnimatedNode(event)).toBe(false);

      expect(hasAnimatedNode([10, 10])).toBe(false);
      expect(hasAnimatedNode([10, anim])).toBe(true);

      expect(hasAnimatedNode({a: 10, b: 10})).toBe(false);
      expect(hasAnimatedNode({a: 10, b: anim})).toBe(true);

      expect(hasAnimatedNode({a: 10, b: {ba: 10, bb: 10}})).toBe(false);
      expect(hasAnimatedNode({a: 10, b: {ba: 10, bb: anim}})).toBe(true);
      expect(hasAnimatedNode({a: 10, b: [10, 10]})).toBe(false);
      expect(hasAnimatedNode({a: 10, b: [10, anim]})).toBe(true);
    });
  });
});

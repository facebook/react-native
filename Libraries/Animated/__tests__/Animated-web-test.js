/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import * as React from 'react';
import TestRenderer from 'react-test-renderer';

let Animated = require('../Animated').default;
let AnimatedProps = require('../nodes/AnimatedProps').default;

jest.mock('../../BatchedBridge/NativeModules', () => ({
  NativeAnimatedModule: {},
  PlatformConstants: {
    getConstants() {
      return {};
    },
  },
}));

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

    it('does not discard initial style', () => {
      const value1 = new Animated.Value(1);
      const scale = value1.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2],
      });
      const callback = jest.fn();
      const node = new AnimatedProps(
        {
          style: {
            transform: [
              {
                scale,
              },
            ],
          },
        },
        callback,
      );

      expect(node.__getValue()).toEqual({
        style: [
          {
            transform: [{scale}],
          },
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
          {
            transform: [{scale}],
          },
          {
            transform: [{scale: 1.5}],
          },
        ],
      });

      node.__detach();
    });

    it('does not detach on updates', () => {
      const opacity = new Animated.Value(0);
      opacity.__detach = jest.fn();

      const root = TestRenderer.create(<Animated.View style={{opacity}} />);
      expect(opacity.__detach).not.toBeCalled();

      root.update(<Animated.View style={{opacity}} />);
      expect(opacity.__detach).not.toBeCalled();

      root.unmount();
      expect(opacity.__detach).toBeCalled();
    });

    it('stops animation when detached', () => {
      const opacity = new Animated.Value(0);
      const callback = jest.fn();

      const root = TestRenderer.create(<Animated.View style={{opacity}} />);

      Animated.timing(opacity, {
        toValue: 10,
        duration: 1000,
        useNativeDriver: false,
      }).start(callback);

      root.unmount();

      expect(callback).toBeCalledWith({finished: false});
    });

    it('triggers callback when spring is at rest', () => {
      const anim = new Animated.Value(0);
      const callback = jest.fn();
      Animated.spring(anim, {
        toValue: 0,
        velocity: 0,
        useNativeDriver: false,
      }).start(callback);
      expect(callback).toBeCalled();
    });

    it('send toValue when a critically damped spring stops', () => {
      const anim = new Animated.Value(0);
      const listener = jest.fn();
      anim.addListener(listener);
      Animated.spring(anim, {
        stiffness: 8000,
        damping: 2000,
        toValue: 15,
        useNativeDriver: false,
      }).start();
      jest.runAllTimers();
      const lastValue =
        listener.mock.calls[listener.mock.calls.length - 2][0].value;
      expect(lastValue).not.toBe(15);
      expect(lastValue).toBeCloseTo(15);
      expect(anim.__getValue()).toBe(15);
    });

    it('convert to JSON', () => {
      expect(JSON.stringify(new Animated.Value(10))).toBe('10');
    });

    it('bypasses `setNativeProps` in test environments', () => {
      const opacity = new Animated.Value(0);

      const testRenderer = TestRenderer.create(
        <Animated.View style={{opacity}} />,
      );

      expect(testRenderer.toJSON().props.style[1].opacity).toEqual(0);

      Animated.timing(opacity, {
        toValue: 1,
        duration: 0,
        useNativeDriver: false,
      }).start();

      expect(testRenderer.toJSON().props.style[1].opacity).toEqual(1);
    });

    it('warns if `useNativeDriver` is missing', () => {
      jest.spyOn(console, 'warn').mockImplementationOnce(() => {});

      Animated.spring(new Animated.Value(0), {
        toValue: 0,
        velocity: 0,
        // useNativeDriver
      }).start();

      expect(console.warn).toBeCalledWith(
        'Animated: `useNativeDriver` was not specified. This is a required option and must be explicitly set to `true` or `false`',
      );
      console.warn.mockRestore();
    });
  });

  describe('Animated Vectors', () => {
    it('should animate vectors', () => {
      const vec = new Animated.ValueXY();
      const vecLayout = vec.getLayout();
      const opacity = vec.x.interpolate({
        inputRange: [0, 42],
        outputRange: [0.2, 0.8],
      });

      const callback = jest.fn();

      const node = new AnimatedProps(
        {
          style: {
            opacity,
            transform: vec.getTranslateTransform(),
            ...vecLayout,
          },
        },
        callback,
      );

      expect(node.__getValue()).toEqual({
        style: [
          {
            top: vecLayout.top,
            left: vecLayout.left,
            opacity,
            transform: vec.getTranslateTransform(),
          },
          {
            opacity: 0.2,
            transform: [{translateX: 0}, {translateY: 0}],
            left: 0,
            top: 0,
          },
        ],
      });

      node.__attach();

      expect(callback.mock.calls.length).toBe(0);

      vec.setValue({x: 42, y: 1492});

      expect(callback.mock.calls.length).toBe(2); // once each for x, y

      expect(node.__getValue()).toEqual({
        style: [
          {
            top: vecLayout.top,
            left: vecLayout.left,
            opacity,
            transform: vec.getTranslateTransform(),
          },
          {
            opacity: 0.8,
            transform: [{translateX: 42}, {translateY: 1492}],
            left: 42,
            top: 1492,
          },
        ],
      });

      node.__detach();

      vec.setValue({x: 1, y: 1});
      expect(callback.mock.calls.length).toBe(2);
    });

    it('should track vectors', () => {
      const value1 = new Animated.ValueXY();
      const value2 = new Animated.ValueXY();
      Animated.timing(value2, {
        toValue: value1,
        duration: 0,
        useNativeDriver: false,
      }).start();
      value1.setValue({x: 42, y: 1492});
      expect(value2.__getValue()).toEqual({x: 42, y: 1492});

      // Make sure tracking keeps working (see stopTogether in ParallelConfig used
      // by maybeVectorAnim).
      value1.setValue({x: 3, y: 4});
      expect(value2.__getValue()).toEqual({x: 3, y: 4});
    });

    it('should track with springs', () => {
      const value1 = new Animated.ValueXY();
      const value2 = new Animated.ValueXY();
      Animated.spring(value2, {
        toValue: value1,
        tension: 3000, // faster spring for faster test
        friction: 60,
        useNativeDriver: false,
      }).start();
      value1.setValue({x: 1, y: 1});
      jest.runAllTimers();
      expect(Math.round(value2.__getValue().x)).toEqual(1);
      expect(Math.round(value2.__getValue().y)).toEqual(1);
      value1.setValue({x: 2, y: 2});
      jest.runAllTimers();
      expect(Math.round(value2.__getValue().x)).toEqual(2);
      expect(Math.round(value2.__getValue().y)).toEqual(2);
    });
  });

  describe('Animated Listeners', () => {
    it('should get updates', () => {
      const value1 = new Animated.Value(0);
      const listener = jest.fn();
      const id = value1.addListener(listener);
      value1.setValue(42);
      expect(listener.mock.calls.length).toBe(1);
      expect(listener).toBeCalledWith({value: 42});
      expect(value1.__getValue()).toBe(42);
      value1.setValue(7);
      expect(listener.mock.calls.length).toBe(2);
      expect(listener).toBeCalledWith({value: 7});
      expect(value1.__getValue()).toBe(7);
      value1.removeListener(id);
      value1.setValue(1492);
      expect(listener.mock.calls.length).toBe(2);
      expect(value1.__getValue()).toBe(1492);
    });

    it('should get updates for derived animated nodes', () => {
      const value1 = new Animated.Value(40);
      const value2 = new Animated.Value(50);
      const value3 = new Animated.Value(0);
      const value4 = Animated.add(value3, Animated.multiply(value1, value2));
      const callback = jest.fn();
      const view = new AnimatedProps(
        {
          style: {
            transform: [
              {
                translateX: value4,
              },
            ],
          },
        },
        callback,
      );
      view.__attach();
      const listener = jest.fn();
      const id = value4.addListener(listener);
      value3.setValue(137);
      expect(listener.mock.calls.length).toBe(1);
      expect(listener).toBeCalledWith({value: 2137});
      value1.setValue(0);
      expect(listener.mock.calls.length).toBe(2);
      expect(listener).toBeCalledWith({value: 137});
      expect(view.__getValue()).toEqual({
        style: [
          {
            transform: [
              {
                translateX: value4,
              },
            ],
          },
          {
            transform: [
              {
                translateX: 137,
              },
            ],
          },
        ],
      });
      value4.removeListener(id);
      value1.setValue(40);
      expect(listener.mock.calls.length).toBe(2);
      expect(value4.__getValue()).toBe(2137);
    });

    it('should removeAll', () => {
      const value1 = new Animated.Value(0);
      const listener = jest.fn();
      [1, 2, 3, 4].forEach(() => value1.addListener(listener));
      value1.setValue(42);
      expect(listener.mock.calls.length).toBe(4);
      expect(listener).toBeCalledWith({value: 42});
      value1.removeAllListeners();
      value1.setValue(7);
      expect(listener.mock.calls.length).toBe(4);
    });
  });

  describe('Animated Colors', () => {
    it('should normalize colors', () => {
      let color = new Animated.Color();
      expect(color.__getValue()).toEqual('rgba(0, 0, 0, 1)');

      color = new Animated.Color({r: 11, g: 22, b: 33, a: 1.0});
      expect(color.__getValue()).toEqual('rgba(11, 22, 33, 1)');

      color = new Animated.Color('rgba(255, 0, 0, 1.0)');
      expect(color.__getValue()).toEqual('rgba(255, 0, 0, 1)');

      color = new Animated.Color('#ff0000ff');
      expect(color.__getValue()).toEqual('rgba(255, 0, 0, 1)');

      color = new Animated.Color('red');
      expect(color.__getValue()).toEqual('rgba(255, 0, 0, 1)');

      color = new Animated.Color({
        r: new Animated.Value(255),
        g: new Animated.Value(0),
        b: new Animated.Value(0),
        a: new Animated.Value(1.0),
      });
      expect(color.__getValue()).toEqual('rgba(255, 0, 0, 1)');

      color = new Animated.Color('unknown');
      expect(color.__getValue()).toEqual('rgba(0, 0, 0, 1)');

      color = new Animated.Color({key: 'value'});
      expect(color.__getValue()).toEqual('rgba(0, 0, 0, 1)');
    });

    it('should animate colors', () => {
      const color = new Animated.Color({r: 255, g: 0, b: 0, a: 1.0});
      const scale = color.a.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2],
      });
      const callback = jest.fn();
      const node = new AnimatedProps(
        {
          style: {
            backgroundColor: color,
            transform: [
              {
                scale,
              },
            ],
          },
        },
        callback,
      );

      expect(node.__getValue()).toEqual({
        style: [
          {
            backgroundColor: color,
            transform: [{scale}],
          },
          {
            backgroundColor: 'rgba(255, 0, 0, 1)',
            transform: [{scale: 2}],
          },
        ],
      });

      node.__attach();
      expect(callback.mock.calls.length).toBe(0);

      color.setValue({r: 11, g: 22, b: 33, a: 0.5});
      expect(callback.mock.calls.length).toBe(4);
      expect(node.__getValue()).toEqual({
        style: [
          {
            backgroundColor: color,
            transform: [{scale}],
          },
          {
            backgroundColor: 'rgba(11, 22, 33, 0.5)',
            transform: [{scale: 1.5}],
          },
        ],
      });

      node.__detach();
      color.setValue({r: 255, g: 0, b: 0, a: 1.0});
      expect(callback.mock.calls.length).toBe(4);
    });

    it('should track colors', () => {
      const color1 = new Animated.Color();
      const color2 = new Animated.Color();
      Animated.timing(color2, {
        toValue: color1,
        duration: 0,
        useNativeDriver: false,
      }).start();
      color1.setValue({r: 11, g: 22, b: 33, a: 0.5});
      expect(color2.__getValue()).toEqual('rgba(11, 22, 33, 0.5)');

      // Make sure tracking keeps working (see stopTogether in ParallelConfig used
      // by maybeVectorAnim).
      color1.setValue({r: 255, g: 0, b: 0, a: 1.0});
      expect(color2.__getValue()).toEqual('rgba(255, 0, 0, 1)');
    });

    it('should track with springs', () => {
      const color1 = new Animated.Color();
      const color2 = new Animated.Color();
      Animated.spring(color2, {
        toValue: color1,
        tension: 3000, // faster spring for faster test
        friction: 60,
        useNativeDriver: false,
      }).start();
      color1.setValue({r: 11, g: 22, b: 33, a: 0.5});
      jest.runAllTimers();
      expect(color2.__getValue()).toEqual('rgba(11, 22, 33, 0.5)');
      color1.setValue({r: 44, g: 55, b: 66, a: 0.0});
      jest.runAllTimers();
      expect(color2.__getValue()).toEqual('rgba(44, 55, 66, 0)');
    });
  });
});

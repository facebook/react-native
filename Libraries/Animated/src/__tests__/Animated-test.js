/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

import TestRenderer from 'react-test-renderer';
import * as React from 'react';

jest.mock('../../../BatchedBridge/NativeModules', () => ({
  NativeAnimatedModule: {},
  PlatformConstants: {
    getConstants() {
      return {};
    },
  },
}));

let Animated = require('../Animated');
describe('Animated tests', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Animated', () => {
    it('works end to end', () => {
      const anim = new Animated.Value(0);

      const callback = jest.fn();

      const node = new Animated.__PropsOnlyForTests(
        {
          style: {
            backgroundColor: 'red',
            opacity: anim,
            transform: [
              {
                translateX: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 200],
                }),
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

      expect(anim.__getChildren().length).toBe(3);

      expect(node.__getValue()).toEqual({
        style: {
          backgroundColor: 'red',
          opacity: 0,
          transform: [{translateX: 100}, {scale: 0}],
          shadowOffset: {
            width: 0,
            height: 0,
          },
        },
      });

      anim.setValue(0.5);

      expect(callback).toBeCalled();

      expect(node.__getValue()).toEqual({
        style: {
          backgroundColor: 'red',
          opacity: 0.5,
          transform: [{translateX: 150}, {scale: 0.5}],
          shadowOffset: {
            width: 0.5,
            height: 0.5,
          },
        },
      });

      node.__detach();
      expect(anim.__getChildren().length).toBe(0);

      anim.setValue(1);
      expect(callback.mock.calls.length).toBe(1);
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

    // This test is flaky and we are asking open source to fix it
    // https://github.com/facebook/react-native/issues/21517
    it.skip('send toValue when an underdamped spring stops', () => {
      const anim = new Animated.Value(0);
      const listener = jest.fn();
      anim.addListener(listener);
      Animated.spring(anim, {toValue: 15, useNativeDriver: false}).start();
      jest.runAllTimers();
      const lastValue =
        listener.mock.calls[listener.mock.calls.length - 2][0].value;
      expect(lastValue).not.toBe(15);
      expect(lastValue).toBeCloseTo(15);
      expect(anim.__getValue()).toBe(15);
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

      expect(testRenderer.toJSON().props.style.opacity).toEqual(0);

      Animated.timing(opacity, {
        toValue: 1,
        duration: 0,
        useNativeDriver: false,
      }).start();

      expect(testRenderer.toJSON().props.style.opacity).toEqual(1);
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

  describe('Animated Sequence', () => {
    it('works with an empty sequence', () => {
      const cb = jest.fn();
      Animated.sequence([]).start(cb);
      expect(cb).toBeCalledWith({finished: true});
    });

    it('sequences well', () => {
      const anim1 = {start: jest.fn()};
      const anim2 = {start: jest.fn()};
      const cb = jest.fn();

      const seq = Animated.sequence([anim1, anim2]);

      expect(anim1.start).not.toBeCalled();
      expect(anim2.start).not.toBeCalled();

      seq.start(cb);

      expect(anim1.start).toBeCalled();
      expect(anim2.start).not.toBeCalled();
      expect(cb).not.toBeCalled();

      anim1.start.mock.calls[0][0]({finished: true});

      expect(anim2.start).toBeCalled();
      expect(cb).not.toBeCalled();

      anim2.start.mock.calls[0][0]({finished: true});
      expect(cb).toBeCalledWith({finished: true});
    });

    it('supports interrupting sequence', () => {
      const anim1 = {start: jest.fn()};
      const anim2 = {start: jest.fn()};
      const cb = jest.fn();

      Animated.sequence([anim1, anim2]).start(cb);

      anim1.start.mock.calls[0][0]({finished: false});

      expect(anim1.start).toBeCalled();
      expect(anim2.start).not.toBeCalled();
      expect(cb).toBeCalledWith({finished: false});
    });

    it('supports stopping sequence', () => {
      const anim1 = {start: jest.fn(), stop: jest.fn()};
      const anim2 = {start: jest.fn(), stop: jest.fn()};
      const cb = jest.fn();

      const seq = Animated.sequence([anim1, anim2]);
      seq.start(cb);
      seq.stop();

      expect(anim1.stop).toBeCalled();
      expect(anim2.stop).not.toBeCalled();
      expect(cb).not.toBeCalled();

      anim1.start.mock.calls[0][0]({finished: false});

      expect(cb).toBeCalledWith({finished: false});
    });
  });

  describe('Animated Loop', () => {
    it('loops indefinitely if config not specified', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(animation);

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).toBeCalled();
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
      expect(animation.reset).toHaveBeenCalledTimes(2);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 2
      expect(animation.reset).toHaveBeenCalledTimes(3);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 3
      expect(animation.reset).toHaveBeenCalledTimes(4);
      expect(cb).not.toBeCalled();
    });

    it('loops indefinitely if iterations is -1', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(animation, {iterations: -1});

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).toBeCalled();
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
      expect(animation.reset).toHaveBeenCalledTimes(2);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 2
      expect(animation.reset).toHaveBeenCalledTimes(3);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 3
      expect(animation.reset).toHaveBeenCalledTimes(4);
      expect(cb).not.toBeCalled();
    });

    it('loops indefinitely if iterations not specified', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(animation, {anotherKey: 'value'});

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).toBeCalled();
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
      expect(animation.reset).toHaveBeenCalledTimes(2);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 2
      expect(animation.reset).toHaveBeenCalledTimes(3);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 3
      expect(animation.reset).toHaveBeenCalledTimes(4);
      expect(cb).not.toBeCalled();
    });

    it('loops three times if iterations is 3', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(animation, {iterations: 3});

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).toBeCalled();
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
      expect(animation.reset).toHaveBeenCalledTimes(2);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 2
      expect(animation.reset).toHaveBeenCalledTimes(3);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 3
      expect(animation.reset).toHaveBeenCalledTimes(3);
      expect(cb).toBeCalledWith({finished: true});
    });

    it('does not loop if iterations is 1', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(animation, {iterations: 1});

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).toBeCalled();
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
      expect(cb).toBeCalledWith({finished: true});
    });

    it('does not animate if iterations is 0', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(animation, {iterations: 0});

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).not.toBeCalled();
      expect(cb).toBeCalledWith({finished: true});
    });

    it('supports interrupting an indefinite loop', () => {
      const animation = {
        start: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      Animated.loop(animation).start(cb);
      expect(animation.start).toBeCalled();
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
      expect(animation.reset).toHaveBeenCalledTimes(2);
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: false}); // Interrupt loop
      expect(animation.reset).toHaveBeenCalledTimes(2);
      expect(cb).toBeCalledWith({finished: false});
    });

    it('supports stopping loop', () => {
      const animation = {
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
        _isUsingNativeDriver: () => false,
      };
      const cb = jest.fn();

      const loop = Animated.loop(animation);
      loop.start(cb);
      loop.stop();

      expect(animation.start).toBeCalled();
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(animation.stop).toBeCalled();

      animation.start.mock.calls[0][0]({finished: false}); // Interrupt loop
      expect(animation.reset).toHaveBeenCalledTimes(1);
      expect(cb).toBeCalledWith({finished: false});
    });
  });

  it('does not reset animation in a loop if resetBeforeIteration is false', () => {
    const animation = {
      start: jest.fn(),
      reset: jest.fn(),
      _isUsingNativeDriver: () => false,
    };
    const cb = jest.fn();

    const loop = Animated.loop(animation, {resetBeforeIteration: false});

    expect(animation.start).not.toBeCalled();

    loop.start(cb);

    expect(animation.start).toBeCalled();
    expect(animation.reset).not.toBeCalled();
    expect(cb).not.toBeCalled();

    animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
    expect(animation.reset).not.toBeCalled();
    expect(cb).not.toBeCalled();

    animation.start.mock.calls[0][0]({finished: true}); // End of loop 2
    expect(animation.reset).not.toBeCalled();
    expect(cb).not.toBeCalled();

    animation.start.mock.calls[0][0]({finished: true}); // End of loop 3
    expect(animation.reset).not.toBeCalled();
    expect(cb).not.toBeCalled();
  });

  describe('Animated Parallel', () => {
    it('works with an empty parallel', () => {
      const cb = jest.fn();
      Animated.parallel([]).start(cb);
      expect(cb).toBeCalledWith({finished: true});
    });

    it('works with an empty element in array', () => {
      const anim1 = {start: jest.fn()};
      const cb = jest.fn();
      Animated.parallel([null, anim1]).start(cb);

      expect(anim1.start).toBeCalled();
      anim1.start.mock.calls[0][0]({finished: true});

      expect(cb).toBeCalledWith({finished: true});
    });

    it('parellelizes well', () => {
      const anim1 = {start: jest.fn()};
      const anim2 = {start: jest.fn()};
      const cb = jest.fn();

      const par = Animated.parallel([anim1, anim2]);

      expect(anim1.start).not.toBeCalled();
      expect(anim2.start).not.toBeCalled();

      par.start(cb);

      expect(anim1.start).toBeCalled();
      expect(anim2.start).toBeCalled();
      expect(cb).not.toBeCalled();

      anim1.start.mock.calls[0][0]({finished: true});
      expect(cb).not.toBeCalled();

      anim2.start.mock.calls[0][0]({finished: true});
      expect(cb).toBeCalledWith({finished: true});
    });

    it('supports stopping parallel', () => {
      const anim1 = {start: jest.fn(), stop: jest.fn()};
      const anim2 = {start: jest.fn(), stop: jest.fn()};
      const cb = jest.fn();

      const seq = Animated.parallel([anim1, anim2]);
      seq.start(cb);
      seq.stop();

      expect(anim1.stop).toBeCalled();
      expect(anim2.stop).toBeCalled();
      expect(cb).not.toBeCalled();

      anim1.start.mock.calls[0][0]({finished: false});
      expect(cb).not.toBeCalled();

      anim2.start.mock.calls[0][0]({finished: false});
      expect(cb).toBeCalledWith({finished: false});
    });

    it('does not call stop more than once when stopping', () => {
      const anim1 = {start: jest.fn(), stop: jest.fn()};
      const anim2 = {start: jest.fn(), stop: jest.fn()};
      const anim3 = {start: jest.fn(), stop: jest.fn()};
      const cb = jest.fn();

      const seq = Animated.parallel([anim1, anim2, anim3]);
      seq.start(cb);

      anim1.start.mock.calls[0][0]({finished: false});

      expect(anim1.stop.mock.calls.length).toBe(0);
      expect(anim2.stop.mock.calls.length).toBe(1);
      expect(anim3.stop.mock.calls.length).toBe(1);

      anim2.start.mock.calls[0][0]({finished: false});

      expect(anim1.stop.mock.calls.length).toBe(0);
      expect(anim2.stop.mock.calls.length).toBe(1);
      expect(anim3.stop.mock.calls.length).toBe(1);

      anim3.start.mock.calls[0][0]({finished: false});

      expect(anim1.stop.mock.calls.length).toBe(0);
      expect(anim2.stop.mock.calls.length).toBe(1);
      expect(anim3.stop.mock.calls.length).toBe(1);
    });
  });

  describe('Animated delays', () => {
    it('should call anim after delay in sequence', () => {
      const anim = {start: jest.fn(), stop: jest.fn()};
      const cb = jest.fn();
      Animated.sequence([Animated.delay(1000), anim]).start(cb);
      jest.runAllTimers();
      expect(anim.start.mock.calls.length).toBe(1);
      expect(cb).not.toBeCalled();
      anim.start.mock.calls[0][0]({finished: true});
      expect(cb).toBeCalledWith({finished: true});
    });
    it('should run stagger to end', () => {
      const cb = jest.fn();
      Animated.stagger(1000, [
        Animated.delay(1000),
        Animated.delay(1000),
        Animated.delay(1000),
      ]).start(cb);
      jest.runAllTimers();
      expect(cb).toBeCalledWith({finished: true});
    });
  });

  describe('Animated Events', () => {
    it('should map events', () => {
      const value = new Animated.Value(0);
      const handler = Animated.event([null, {state: {foo: value}}], {
        useNativeDriver: false,
      });
      handler({bar: 'ignoreBar'}, {state: {baz: 'ignoreBaz', foo: 42}});
      expect(value.__getValue()).toBe(42);
    });
    it('should call listeners', () => {
      const value = new Animated.Value(0);
      const listener = jest.fn();
      const handler = Animated.event([{foo: value}], {
        listener,
        useNativeDriver: false,
      });
      handler({foo: 42});
      expect(value.__getValue()).toBe(42);
      expect(listener.mock.calls.length).toBe(1);
      expect(listener).toBeCalledWith({foo: 42});
    });
    it('should call forked event listeners, with Animated.event() listener', () => {
      const value = new Animated.Value(0);
      const listener = jest.fn();
      const handler = Animated.event([{foo: value}], {
        listener,
        useNativeDriver: false,
      });
      const listener2 = jest.fn();
      const forkedHandler = Animated.forkEvent(handler, listener2);
      forkedHandler({foo: 42});
      expect(value.__getValue()).toBe(42);
      expect(listener.mock.calls.length).toBe(1);
      expect(listener).toBeCalledWith({foo: 42});
      expect(listener2.mock.calls.length).toBe(1);
      expect(listener2).toBeCalledWith({foo: 42});
    });
    it('should call forked event listeners, with js listener', () => {
      const listener = jest.fn();
      const listener2 = jest.fn();
      const forkedHandler = Animated.forkEvent(listener, listener2);
      forkedHandler({foo: 42});
      expect(listener.mock.calls.length).toBe(1);
      expect(listener).toBeCalledWith({foo: 42});
      expect(listener2.mock.calls.length).toBe(1);
      expect(listener2).toBeCalledWith({foo: 42});
    });
    it('should call forked event listeners, with undefined listener', () => {
      const listener = undefined;
      const listener2 = jest.fn();
      const forkedHandler = Animated.forkEvent(listener, listener2);
      forkedHandler({foo: 42});
      expect(listener2.mock.calls.length).toBe(1);
      expect(listener2).toBeCalledWith({foo: 42});
    });
  });

  describe('Animated Interactions', () => {
    /*eslint-disable no-shadow*/
    let Animated;
    /*eslint-enable*/
    let InteractionManager;

    beforeEach(() => {
      jest.mock('../../../Interaction/InteractionManager');
      Animated = require('../Animated');
      InteractionManager = require('../../../Interaction/InteractionManager');
    });

    afterEach(() => {
      jest.unmock('../../../Interaction/InteractionManager');
    });

    it('registers an interaction by default', () => {
      InteractionManager.createInteractionHandle.mockReturnValue(777);

      const value = new Animated.Value(0);
      const callback = jest.fn();
      Animated.timing(value, {
        toValue: 100,
        duration: 100,
        useNativeDriver: false,
      }).start(callback);
      jest.runAllTimers();

      expect(InteractionManager.createInteractionHandle).toBeCalled();
      expect(InteractionManager.clearInteractionHandle).toBeCalledWith(777);
      expect(callback).toBeCalledWith({finished: true});
    });

    it('does not register an interaction when specified', () => {
      const value = new Animated.Value(0);
      const callback = jest.fn();
      Animated.timing(value, {
        toValue: 100,
        duration: 100,
        isInteraction: false,
        useNativeDriver: false,
      }).start(callback);
      jest.runAllTimers();

      expect(InteractionManager.createInteractionHandle).not.toBeCalled();
      expect(InteractionManager.clearInteractionHandle).not.toBeCalled();
      expect(callback).toBeCalledWith({finished: true});
    });
  });

  describe('Animated Tracking', () => {
    it('should track values', () => {
      const value1 = new Animated.Value(0);
      const value2 = new Animated.Value(0);
      Animated.timing(value2, {
        toValue: value1,
        duration: 0,
        useNativeDriver: false,
      }).start();
      value1.setValue(42);
      expect(value2.__getValue()).toBe(42);
      value1.setValue(7);
      expect(value2.__getValue()).toBe(7);
    });

    it('should track interpolated values', () => {
      const value1 = new Animated.Value(0);
      const value2 = new Animated.Value(0);
      Animated.timing(value2, {
        toValue: value1.interpolate({
          inputRange: [0, 2],
          outputRange: [0, 1],
        }),
        duration: 0,
        useNativeDriver: false,
      }).start();
      value1.setValue(42);
      expect(value2.__getValue()).toBe(42 / 2);
    });

    it('should stop tracking when animated', () => {
      const value1 = new Animated.Value(0);
      const value2 = new Animated.Value(0);
      Animated.timing(value2, {
        toValue: value1,
        duration: 0,
        useNativeDriver: false,
      }).start();
      value1.setValue(42);
      expect(value2.__getValue()).toBe(42);
      Animated.timing(value2, {
        toValue: 7,
        duration: 0,
        useNativeDriver: false,
      }).start();
      value1.setValue(1492);
      expect(value2.__getValue()).toBe(7);
    });
  });

  describe('Animated Vectors', () => {
    it('should animate vectors', () => {
      const vec = new Animated.ValueXY();

      const callback = jest.fn();

      const node = new Animated.__PropsOnlyForTests(
        {
          style: {
            opacity: vec.x.interpolate({
              inputRange: [0, 42],
              outputRange: [0.2, 0.8],
            }),
            transform: vec.getTranslateTransform(),
            ...vec.getLayout(),
          },
        },
        callback,
      );

      expect(node.__getValue()).toEqual({
        style: {
          opacity: 0.2,
          transform: [{translateX: 0}, {translateY: 0}],
          left: 0,
          top: 0,
        },
      });

      vec.setValue({x: 42, y: 1492});

      expect(callback.mock.calls.length).toBe(2); // once each for x, y

      expect(node.__getValue()).toEqual({
        style: {
          opacity: 0.8,
          transform: [{translateX: 42}, {translateY: 1492}],
          left: 42,
          top: 1492,
        },
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
      const view = new Animated.__PropsOnlyForTests(
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
      const listener = jest.fn();
      const id = value4.addListener(listener);
      value3.setValue(137);
      expect(listener.mock.calls.length).toBe(1);
      expect(listener).toBeCalledWith({value: 2137});
      value1.setValue(0);
      expect(listener.mock.calls.length).toBe(2);
      expect(listener).toBeCalledWith({value: 137});
      expect(view.__getValue()).toEqual({
        style: {
          transform: [
            {
              translateX: 137,
            },
          ],
        },
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

  describe('Animated Diff Clamp', () => {
    it('should get the proper value', () => {
      const inputValues = [0, 20, 40, 30, 0, -40, -10, -20, 0];
      const expectedValues = [0, 20, 20, 10, 0, 0, 20, 10, 20];
      const value = new Animated.Value(0);
      const diffClampValue = Animated.diffClamp(value, 0, 20);
      for (let i = 0; i < inputValues.length; i++) {
        value.setValue(inputValues[i]);
        expect(diffClampValue.__getValue()).toBe(expectedValues[i]);
      }
    });
  });
});

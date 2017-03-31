/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

var Animated = require('Animated');
describe('Animated tests', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Animated', () => {

    it('works end to end', () => {
      var anim = new Animated.Value(0);

      var callback = jest.fn();

      var node = new Animated.__PropsOnlyForTests({
        style: {
          backgroundColor: 'red',
          opacity: anim,
          transform: [
            {translateX: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 200],
            })},
            {scale: anim},
          ],
          shadowOffset: {
            width: anim,
            height: anim,
          },
        }
      }, callback);

      expect(anim.__getChildren().length).toBe(3);

      expect(node.__getValue()).toEqual({
        style: {
          backgroundColor: 'red',
          opacity: 0,
          transform: [
            {translateX: 100},
            {scale: 0},
          ],
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
          transform: [
            {translateX: 150},
            {scale: 0.5},
          ],
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
      var anim = new Animated.Value(0);
      anim.__detach = jest.fn();

      var c = new Animated.View();
      c.props = {
        style: {
          opacity: anim,
        },
      };
      c.componentWillMount();

      expect(anim.__detach).not.toBeCalled();
      c._component = {};
      c.componentWillReceiveProps({
        style: {
          opacity: anim,
        },
      });
      expect(anim.__detach).not.toBeCalled();

      c.componentWillUnmount();
      expect(anim.__detach).toBeCalled();
    });


    it('stops animation when detached', () => {
      // jest environment doesn't have cancelAnimationFrame :(
      if (!global.cancelAnimationFrame) {
        global.cancelAnimationFrame = jest.fn();
      }

      var anim = new Animated.Value(0);
      var callback = jest.fn();

      var c = new Animated.View();
      c.props = {
        style: {
          opacity: anim,
        },
      };
      c.componentWillMount();

      Animated.timing(anim, {toValue: 10, duration: 1000}).start(callback);
      c._component = {};
      c.componentWillUnmount();

      expect(callback).toBeCalledWith({finished: false});
      expect(callback).toBeCalledWith({finished: false});
    });

    it('triggers callback when spring is at rest', () => {
      var anim = new Animated.Value(0);
      var callback = jest.fn();
      Animated.spring(anim, {toValue: 0, velocity: 0}).start(callback);
      expect(callback).toBeCalled();
    });

    it('send toValue when a spring stops', () => {
      var anim = new Animated.Value(0);
      var listener = jest.fn();
      anim.addListener(listener);
      Animated.spring(anim, {toValue: 15}).start();
      jest.runAllTimers();
      var lastValue = listener.mock.calls[listener.mock.calls.length - 2][0].value;
      expect(lastValue).not.toBe(15);
      expect(lastValue).toBeCloseTo(15);
      expect(anim.__getValue()).toBe(15);
    });

    it('convert to JSON', () => {
      expect(JSON.stringify(new Animated.Value(10))).toBe('10');
    });
  });


  describe('Animated Sequence', () => {

    it('works with an empty sequence', () => {
      var cb = jest.fn();
      Animated.sequence([]).start(cb);
      expect(cb).toBeCalledWith({finished: true});
    });

    it('sequences well', () => {
      var anim1 = {start: jest.fn()};
      var anim2 = {start: jest.fn()};
      var cb = jest.fn();

      var seq = Animated.sequence([anim1, anim2]);

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
      var anim1 = {start: jest.fn()};
      var anim2 = {start: jest.fn()};
      var cb = jest.fn();

      Animated.sequence([anim1, anim2]).start(cb);

      anim1.start.mock.calls[0][0]({finished: false});

      expect(anim1.start).toBeCalled();
      expect(anim2.start).not.toBeCalled();
      expect(cb).toBeCalledWith({finished: false});
    });

    it('supports stopping sequence', () => {
      var anim1 = {start: jest.fn(), stop: jest.fn()};
      var anim2 = {start: jest.fn(), stop: jest.fn()};
      var cb = jest.fn();

      var seq = Animated.sequence([anim1, anim2]);
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
      var animation = {start: jest.fn(), reset: jest.fn(), _isUsingNativeDriver: () => false};
      var cb = jest.fn();

      var loop = Animated.loop(animation);

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
      var animation = {start: jest.fn(), reset: jest.fn(), _isUsingNativeDriver: () => false};
      var cb = jest.fn();

      var loop = Animated.loop(animation, { iterations: -1 });

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
      var animation = {start: jest.fn(), reset: jest.fn(), _isUsingNativeDriver: () => false};
      var cb = jest.fn();

      var loop = Animated.loop(animation, { anotherKey: 'value' });

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
      var animation = {start: jest.fn(), reset: jest.fn(), _isUsingNativeDriver: () => false};
      var cb = jest.fn();

      var loop = Animated.loop(animation, { iterations: 3 });

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
      var animation = {start: jest.fn(), reset: jest.fn(), _isUsingNativeDriver: () => false};
      var cb = jest.fn();

      var loop = Animated.loop(animation, { iterations: 1 });

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).toBeCalled();
      expect(cb).not.toBeCalled();

      animation.start.mock.calls[0][0]({finished: true}); // End of loop 1
      expect(cb).toBeCalledWith({finished: true});
    });

    it('does not animate if iterations is 0', () => {
      var animation = {start: jest.fn(), reset: jest.fn(), _isUsingNativeDriver: () => false};
      var cb = jest.fn();

      var loop = Animated.loop(animation, { iterations: 0 });

      expect(animation.start).not.toBeCalled();

      loop.start(cb);

      expect(animation.start).not.toBeCalled();
      expect(cb).toBeCalledWith({ finished: true });
    });

    it('supports interrupting an indefinite loop', () => {
      var animation = {start: jest.fn(), reset: jest.fn(), _isUsingNativeDriver: () => false};
      var cb = jest.fn();

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
      var animation = {start: jest.fn(), stop: jest.fn(), reset: jest.fn(), _isUsingNativeDriver: () => false};
      var cb = jest.fn();

      var loop = Animated.loop(animation);
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

  describe('Animated Parallel', () => {

    it('works with an empty parallel', () => {
      var cb = jest.fn();
      Animated.parallel([]).start(cb);
      expect(cb).toBeCalledWith({finished: true});
    });

    it('works with an empty element in array', () => {
      var anim1 = {start: jest.fn()};
      var cb = jest.fn();
      Animated.parallel([null, anim1]).start(cb);

      expect(anim1.start).toBeCalled();
      anim1.start.mock.calls[0][0]({finished: true});

      expect(cb).toBeCalledWith({finished: true});
    });

    it('parellelizes well', () => {
      var anim1 = {start: jest.fn()};
      var anim2 = {start: jest.fn()};
      var cb = jest.fn();

      var par = Animated.parallel([anim1, anim2]);

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
      var anim1 = {start: jest.fn(), stop: jest.fn()};
      var anim2 = {start: jest.fn(), stop: jest.fn()};
      var cb = jest.fn();

      var seq = Animated.parallel([anim1, anim2]);
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
      var anim1 = {start: jest.fn(), stop: jest.fn()};
      var anim2 = {start: jest.fn(), stop: jest.fn()};
      var anim3 = {start: jest.fn(), stop: jest.fn()};
      var cb = jest.fn();

      var seq = Animated.parallel([anim1, anim2, anim3]);
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
      var anim = {start: jest.fn(), stop: jest.fn()};
      var cb = jest.fn();
      Animated.sequence([
        Animated.delay(1000),
        anim,
      ]).start(cb);
      jest.runAllTimers();
      expect(anim.start.mock.calls.length).toBe(1);
      expect(cb).not.toBeCalled();
      anim.start.mock.calls[0][0]({finished: true});
      expect(cb).toBeCalledWith({finished: true});
    });
    it('should run stagger to end', () => {
      var cb = jest.fn();
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
      var value = new Animated.Value(0);
      var handler = Animated.event(
        [null, {state: {foo: value}}],
      );
      handler({bar: 'ignoreBar'}, {state: {baz: 'ignoreBaz', foo: 42}});
      expect(value.__getValue()).toBe(42);
    });
    it('should call listeners', () => {
      var value = new Animated.Value(0);
      var listener = jest.fn();
      var handler = Animated.event(
        [{foo: value}],
        {listener},
      );
      handler({foo: 42});
      expect(value.__getValue()).toBe(42);
      expect(listener.mock.calls.length).toBe(1);
      expect(listener).toBeCalledWith({foo: 42});
    });
    it('should call forked event listeners', () => {
      var value = new Animated.Value(0);
      var listener = jest.fn();
      var handler = Animated.event(
        [{foo: value}],
        {listener},
      );
      var listener2 = jest.fn();
      var forkedHandler = Animated.forkEvent(handler, listener2);
      forkedHandler({foo: 42});
      expect(value.__getValue()).toBe(42);
      expect(listener.mock.calls.length).toBe(1);
      expect(listener).toBeCalledWith({foo: 42});
      expect(listener2.mock.calls.length).toBe(1);
      expect(listener2).toBeCalledWith({foo: 42});
    });
  });

  describe('Animated Interactions', () => {
    /*eslint-disable no-shadow*/
    var Animated;
    /*eslint-enable*/
    var InteractionManager;

    beforeEach(() => {
      jest.mock('InteractionManager');
      Animated = require('Animated');
      InteractionManager = require('InteractionManager');
    });

    afterEach(()=> {
      jest.unmock('InteractionManager');
    });

    it('registers an interaction by default', () => {
      InteractionManager.createInteractionHandle.mockReturnValue(777);

      var value = new Animated.Value(0);
      var callback = jest.fn();
      Animated.timing(value, {
        toValue: 100,
        duration: 100,
      }).start(callback);
      jest.runAllTimers();

      expect(InteractionManager.createInteractionHandle).toBeCalled();
      expect(InteractionManager.clearInteractionHandle).toBeCalledWith(777);
      expect(callback).toBeCalledWith({finished: true});
    });

    it('does not register an interaction when specified', () => {
      var value = new Animated.Value(0);
      var callback = jest.fn();
      Animated.timing(value, {
        toValue: 100,
        duration: 100,
        isInteraction: false,
      }).start(callback);
      jest.runAllTimers();

      expect(InteractionManager.createInteractionHandle).not.toBeCalled();
      expect(InteractionManager.clearInteractionHandle).not.toBeCalled();
      expect(callback).toBeCalledWith({finished: true});
    });
  });

  describe('Animated Tracking', () => {
    it('should track values', () => {
      var value1 = new Animated.Value(0);
      var value2 = new Animated.Value(0);
      Animated.timing(value2, {
        toValue: value1,
        duration: 0,
      }).start();
      value1.setValue(42);
      expect(value2.__getValue()).toBe(42);
      value1.setValue(7);
      expect(value2.__getValue()).toBe(7);
    });

    it('should track interpolated values', () => {
      var value1 = new Animated.Value(0);
      var value2 = new Animated.Value(0);
      Animated.timing(value2, {
        toValue: value1.interpolate({
          inputRange: [0, 2],
          outputRange: [0, 1]
        }),
        duration: 0,
      }).start();
      value1.setValue(42);
      expect(value2.__getValue()).toBe(42 / 2);
    });

    it('should stop tracking when animated', () => {
      var value1 = new Animated.Value(0);
      var value2 = new Animated.Value(0);
      Animated.timing(value2, {
        toValue: value1,
        duration: 0,
      }).start();
      value1.setValue(42);
      expect(value2.__getValue()).toBe(42);
      Animated.timing(value2, {
        toValue: 7,
        duration: 0,
      }).start();
      value1.setValue(1492);
      expect(value2.__getValue()).toBe(7);
    });
  });

  describe('Animated Vectors', () => {
    it('should animate vectors', () => {
      var vec = new Animated.ValueXY();

      var callback = jest.fn();

      var node = new Animated.__PropsOnlyForTests({
        style: {
          opacity: vec.x.interpolate({
            inputRange: [0, 42],
            outputRange: [0.2, 0.8],
          }),
          transform: vec.getTranslateTransform(),
          ...vec.getLayout(),
        }
      }, callback);

      expect(node.__getValue()).toEqual({
        style: {
          opacity: 0.2,
          transform: [
            {translateX: 0},
            {translateY: 0},
          ],
          left: 0,
          top: 0,
        },
      });

      vec.setValue({x: 42, y: 1492});

      expect(callback.mock.calls.length).toBe(2); // once each for x, y

      expect(node.__getValue()).toEqual({
        style: {
          opacity: 0.8,
          transform: [
            {translateX: 42},
            {translateY: 1492},
          ],
          left: 42,
          top: 1492,
        },
      });

      node.__detach();

      vec.setValue({x: 1, y: 1});
      expect(callback.mock.calls.length).toBe(2);
    });

    it('should track vectors', () => {
      var value1 = new Animated.ValueXY();
      var value2 = new Animated.ValueXY();
      Animated.timing(value2, {
        toValue: value1,
        duration: 0,
      }).start();
      value1.setValue({x: 42, y: 1492});
      expect(value2.__getValue()).toEqual({x: 42, y: 1492});

      // Make sure tracking keeps working (see stopTogether in ParallelConfig used
      // by maybeVectorAnim).
      value1.setValue({x: 3, y: 4});
      expect(value2.__getValue()).toEqual({x: 3, y: 4});
    });

    it('should track with springs', () => {
      var value1 = new Animated.ValueXY();
      var value2 = new Animated.ValueXY();
      Animated.spring(value2, {
        toValue: value1,
        tension: 3000, // faster spring for faster test
        friction: 60,
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
      var value1 = new Animated.Value(0);
      var listener = jest.fn();
      var id = value1.addListener(listener);
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

    it('should removeAll', () => {
      var value1 = new Animated.Value(0);
      var listener = jest.fn();
      [1,2,3,4].forEach(() => value1.addListener(listener));
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

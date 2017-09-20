/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .clearAllMocks()
  .setMock('Text', {})
  .setMock('View', {})
  .setMock('Image', {})
  .setMock('React', {Component: class {}})
  .setMock('NativeModules', {
    NativeAnimatedModule: {},
  })
  .mock('NativeEventEmitter')
  // findNodeHandle is imported from ReactNative so mock that whole module.
  .setMock('ReactNative', {findNodeHandle: () => 1});

const Animated = require('Animated');
const NativeAnimatedHelper = require('NativeAnimatedHelper');

function createAndMountComponent(ComponentClass, props) {
  const component = new ComponentClass();
  component.props = props;
  component.componentWillMount();
  // Simulate that refs were set.
  component._component = {};
  component.componentDidMount();
  return component;
}

describe('Native Animated', () => {

  const nativeAnimatedModule = require('NativeModules').NativeAnimatedModule;

  beforeEach(() => {
    nativeAnimatedModule.addAnimatedEventToView = jest.fn();
    nativeAnimatedModule.connectAnimatedNodes = jest.fn();
    nativeAnimatedModule.connectAnimatedNodeToView = jest.fn();
    nativeAnimatedModule.createAnimatedNode = jest.fn();
    nativeAnimatedModule.disconnectAnimatedNodeFromView = jest.fn();
    nativeAnimatedModule.disconnectAnimatedNodes = jest.fn();
    nativeAnimatedModule.dropAnimatedNode = jest.fn();
    nativeAnimatedModule.extractAnimatedNodeOffset = jest.fn();
    nativeAnimatedModule.flattenAnimatedNodeOffset = jest.fn();
    nativeAnimatedModule.removeAnimatedEventFromView = jest.fn();
    nativeAnimatedModule.setAnimatedNodeOffset = jest.fn();
    nativeAnimatedModule.setAnimatedNodeValue = jest.fn();
    nativeAnimatedModule.startAnimatingNode = jest.fn();
    nativeAnimatedModule.startListeningToAnimatedNodeValue = jest.fn();
    nativeAnimatedModule.stopAnimation = jest.fn();
    nativeAnimatedModule.stopListeningToAnimatedNodeValue = jest.fn();
  });

  describe('Animated Value', () => {
    it('proxies `setValue` correctly', () => {
      const anim = new Animated.Value(0);
      Animated.timing(anim, {toValue: 10, duration: 1000, useNativeDriver: true}).start();

      const c = createAndMountComponent(Animated.View, {
        style: {
          opacity: anim,
        },
      });

      // We expect `setValue` not to propagate down to `setNativeProps`, otherwise it may try to access `setNativeProps`
      // via component refs table that we override here.
      c.refs = {
        node: {
          setNativeProps: jest.genMockFunction(),
        },
      };

      anim.setValue(0.5);

      expect(nativeAnimatedModule.setAnimatedNodeValue).toBeCalledWith(jasmine.any(Number), 0.5);
      expect(c.refs.node.setNativeProps).not.toHaveBeenCalled();
    });

    it('should set offset', () => {
      const anim = new Animated.Value(0);
      anim.setOffset(10);
      anim.__makeNative();
      createAndMountComponent(Animated.View, {
        style: {
          opacity: anim,
        },
      });

      expect(nativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        jasmine.any(Number),
        {type: 'value', value: 0, offset: 10},
      );
      anim.setOffset(20);
      expect(nativeAnimatedModule.setAnimatedNodeOffset)
        .toBeCalledWith(jasmine.any(Number), 20);
    });

    it('should flatten offset', () => {
      const anim = new Animated.Value(0);
      anim.__makeNative();
      createAndMountComponent(Animated.View, {
        style: {
          opacity: anim,
        },
      });

      expect(nativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        jasmine.any(Number),
        {type: 'value', value: 0, offset: 0},
      );
      anim.flattenOffset();
      expect(nativeAnimatedModule.flattenAnimatedNodeOffset)
        .toBeCalledWith(jasmine.any(Number));
    });

    it('should extract offset', () => {
      const anim = new Animated.Value(0);
      anim.__makeNative();
      createAndMountComponent(Animated.View, {
        style: {
          opacity: anim,
        },
      });

      expect(nativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        jasmine.any(Number),
        {type: 'value', value: 0, offset: 0},
      );
      anim.extractOffset();
      expect(nativeAnimatedModule.extractAnimatedNodeOffset)
        .toBeCalledWith(jasmine.any(Number));
    });
  });

  describe('Animated Listeners', () => {
    it('should get updates', () => {
      const value1 = new Animated.Value(0);
      value1.__makeNative();
      const listener = jest.fn();
      const id = value1.addListener(listener);
      expect(nativeAnimatedModule.startListeningToAnimatedNodeValue)
        .toHaveBeenCalledWith(value1.__getNativeTag());

      NativeAnimatedHelper.nativeEventEmitter.emit(
        'onAnimatedValueUpdate',
        {value: 42, tag: value1.__getNativeTag()},
      );
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toBeCalledWith({value: 42});
      expect(value1.__getValue()).toBe(42);

      NativeAnimatedHelper.nativeEventEmitter.emit(
        'onAnimatedValueUpdate',
        {value: 7, tag: value1.__getNativeTag()},
      );
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toBeCalledWith({value: 7});
      expect(value1.__getValue()).toBe(7);

      value1.removeListener(id);
      expect(nativeAnimatedModule.stopListeningToAnimatedNodeValue)
        .toHaveBeenCalledWith(value1.__getNativeTag());

      NativeAnimatedHelper.nativeEventEmitter.emit(
        'onAnimatedValueUpdate',
        {value: 1492, tag: value1.__getNativeTag()},
      );
      expect(listener).toHaveBeenCalledTimes(2);
      expect(value1.__getValue()).toBe(7);
    });

    it('should removeAll', () => {
      const value1 = new Animated.Value(0);
      value1.__makeNative();
      const listener = jest.fn();
      [1,2,3,4].forEach(() => value1.addListener(listener));
      expect(nativeAnimatedModule.startListeningToAnimatedNodeValue)
        .toHaveBeenCalledWith(value1.__getNativeTag());

      NativeAnimatedHelper.nativeEventEmitter.emit(
        'onAnimatedValueUpdate',
        {value: 42, tag: value1.__getNativeTag()},
      );
      expect(listener).toHaveBeenCalledTimes(4);
      expect(listener).toBeCalledWith({value: 42});

      value1.removeAllListeners();
      expect(nativeAnimatedModule.stopListeningToAnimatedNodeValue)
        .toHaveBeenCalledWith(value1.__getNativeTag());

      NativeAnimatedHelper.nativeEventEmitter.emit(
        'onAnimatedValueUpdate',
        {value: 7, tag: value1.__getNativeTag()},
      );
      expect(listener).toHaveBeenCalledTimes(4);
    });
  });

  describe('Animated Events', () => {
    it('should map events', () => {
      const value = new Animated.Value(0);
      value.__makeNative();
      const event = Animated.event(
        [{nativeEvent: {state: {foo: value}}}],
        {useNativeDriver: true},
      );
      const c = createAndMountComponent(Animated.View, {onTouchMove: event});
      expect(nativeAnimatedModule.addAnimatedEventToView).toBeCalledWith(
        jasmine.any(Number),
        'onTouchMove',
        {nativeEventPath: ['state', 'foo'], animatedValueTag: value.__getNativeTag()},
      );

      c.componentWillUnmount();
      expect(nativeAnimatedModule.removeAnimatedEventFromView).toBeCalledWith(
        jasmine.any(Number),
        'onTouchMove',
        value.__getNativeTag(),
      );
    });

    it('should throw on invalid event path', () => {
      const value = new Animated.Value(0);
      value.__makeNative();
      const event = Animated.event(
        [{notNativeEvent: {foo: value}}],
        {useNativeDriver: true},
      );
      expect(() => createAndMountComponent(Animated.View, {onTouchMove: event}))
        .toThrowError(/nativeEvent/);
      expect(nativeAnimatedModule.addAnimatedEventToView).not.toBeCalled();
    });

    it('should call listeners', () => {
      const value = new Animated.Value(0);
      value.__makeNative();
      const listener = jest.fn();
      const event = Animated.event(
        [{nativeEvent: {foo: value}}],
        {useNativeDriver: true, listener},
      );
      const handler = event.__getHandler();
      handler({foo: 42});
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toBeCalledWith({foo: 42});
    });
  });

  describe('Animated Graph', () => {
    it('creates and detaches nodes', () => {
      const anim = new Animated.Value(0);
      const c = createAndMountComponent(Animated.View, {
        style: {
          opacity: anim,
        },
      });

      Animated.timing(anim, {toValue: 10, duration: 1000, useNativeDriver: true}).start();

      c.componentWillUnmount();

      expect(nativeAnimatedModule.createAnimatedNode).toHaveBeenCalledTimes(3);
      expect(nativeAnimatedModule.connectAnimatedNodes).toHaveBeenCalledTimes(2);

      expect(nativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        {type: 'frames', frames: jasmine.any(Array), toValue: jasmine.any(Number), iterations: 1},
        jasmine.any(Function)
      );

      expect(nativeAnimatedModule.disconnectAnimatedNodes).toHaveBeenCalledTimes(2);
      expect(nativeAnimatedModule.dropAnimatedNode).toHaveBeenCalledTimes(3);
    });

    it('sends a valid description for value, style and props nodes', () => {
      const anim = new Animated.Value(0);
      createAndMountComponent(Animated.View, {
        style: {
          opacity: anim,
        },
      });

      Animated.timing(anim, {toValue: 10, duration: 1000, useNativeDriver: true}).start();

      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(jasmine.any(Number), {type: 'value', value: 0, offset: 0});
      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(jasmine.any(Number), {type: 'style', style: {opacity: jasmine.any(Number)}});
      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(jasmine.any(Number), {type: 'props', props: {style: jasmine.any(Number)}});
    });

    it('sends a valid graph description for Animated.add nodes', () => {
      const first = new Animated.Value(1);
      const second = new Animated.Value(2);
      first.__makeNative();
      second.__makeNative();

      createAndMountComponent(Animated.View, {
        style: {
          opacity: Animated.add(first, second),
        },
      });

      expect(nativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        jasmine.any(Number),
        {type: 'addition', input: jasmine.any(Array)},
      );
      const additionCalls = nativeAnimatedModule.createAnimatedNode.mock.calls.filter(
        (call) => call[1].type === 'addition'
      );
      expect(additionCalls.length).toBe(1);
      const additionCall = additionCalls[0];
      const additionNodeTag = additionCall[0];
      const additionConnectionCalls = nativeAnimatedModule.connectAnimatedNodes.mock.calls.filter(
        (call) => call[1] === additionNodeTag
      );
      expect(additionConnectionCalls.length).toBe(2);
      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(additionCall[1].input[0], {type: 'value', value: 1, offset: 0});
      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(additionCall[1].input[1], {type: 'value', value: 2, offset: 0});
    });

    it('sends a valid graph description for Animated.multiply nodes', () => {
      const first = new Animated.Value(2);
      const second = new Animated.Value(1);
      first.__makeNative();
      second.__makeNative();

      createAndMountComponent(Animated.View, {
        style: {
          opacity: Animated.multiply(first, second),
        },
      });

      expect(nativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        jasmine.any(Number),
        {type: 'multiplication', input: jasmine.any(Array)},
      );
      const multiplicationCalls = nativeAnimatedModule.createAnimatedNode.mock.calls.filter(
        (call) => call[1].type === 'multiplication'
      );
      expect(multiplicationCalls.length).toBe(1);
      const multiplicationCall = multiplicationCalls[0];
      const multiplicationNodeTag = multiplicationCall[0];
      const multiplicationConnectionCalls = nativeAnimatedModule.connectAnimatedNodes.mock.calls.filter(
        (call) => call[1] === multiplicationNodeTag
      );
      expect(multiplicationConnectionCalls.length).toBe(2);
      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(multiplicationCall[1].input[0], {type: 'value', value: 2, offset: 0});
      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(multiplicationCall[1].input[1], {type: 'value', value: 1, offset: 0});
    });

    it('sends a valid graph description for Animated.divide nodes', () => {
      const first = new Animated.Value(4);
      const second = new Animated.Value(2);
      first.__makeNative();
      second.__makeNative();

      createAndMountComponent(Animated.View, {
        style: {
          opacity: Animated.divide(first, second),
        },
      });

      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(jasmine.any(Number), {type: 'division', input: jasmine.any(Array)});
      const divisionCalls = nativeAnimatedModule.createAnimatedNode.mock.calls.filter(
        (call) => call[1].type === 'division'
      );
      expect(divisionCalls.length).toBe(1);
      const divisionCall = divisionCalls[0];
      const divisionNodeTag = divisionCall[0];
      const divisionConnectionCalls = nativeAnimatedModule.connectAnimatedNodes.mock.calls.filter(
        (call) => call[1] === divisionNodeTag
      );
      expect(divisionConnectionCalls.length).toBe(2);
      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(divisionCall[1].input[0], {type: 'value', value: 4, offset: 0});
      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(divisionCall[1].input[1], {type: 'value', value: 2, offset: 0});
    });

    it('sends a valid graph description for Animated.modulo nodes', () => {
      const value = new Animated.Value(4);
      value.__makeNative();

      createAndMountComponent(Animated.View, {
        style: {
          opacity: Animated.modulo(value, 4),
        },
      });

      expect(nativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        jasmine.any(Number),
        {type: 'modulus', modulus: 4, input: jasmine.any(Number)},
      );
      const moduloCalls = nativeAnimatedModule.createAnimatedNode.mock.calls.filter(
        (call) => call[1].type === 'modulus'
      );
      expect(moduloCalls.length).toBe(1);
      const moduloCall = moduloCalls[0];
      const moduloNodeTag = moduloCall[0];
      const moduloConnectionCalls = nativeAnimatedModule.connectAnimatedNodes.mock.calls.filter(
        (call) => call[1] === moduloNodeTag
      );
      expect(moduloConnectionCalls.length).toBe(1);
      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(moduloCall[1].input, {type: 'value', value: 4, offset: 0});
    });

    it('sends a valid graph description for interpolate() nodes', () => {
      const value = new Animated.Value(10);
      value.__makeNative();

      createAndMountComponent(Animated.View, {
        style: {
          opacity: value.interpolate({
            inputRange: [10, 20],
            outputRange: [0, 1],
          }),
        },
      });

      expect(nativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        jasmine.any(Number),
        {type: 'value', value: 10, offset: 0}
      );
      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(jasmine.any(Number), {
          type: 'interpolation',
          inputRange: [10, 20],
          outputRange: [0, 1],
          extrapolateLeft: 'extend',
          extrapolateRight: 'extend',
        });
      const interpolationNodeTag = nativeAnimatedModule.createAnimatedNode.mock.calls.find(
        (call) => call[1].type === 'interpolation'
      )[0];
      const valueNodeTag = nativeAnimatedModule.createAnimatedNode.mock.calls.find(
        (call) => call[1].type === 'value'
      )[0];
      expect(nativeAnimatedModule.connectAnimatedNodes).toBeCalledWith(valueNodeTag, interpolationNodeTag);
    });

    it('sends a valid graph description for transform nodes', () => {
      const value = new Animated.Value(0);
      value.__makeNative();

      createAndMountComponent(Animated.View, {
        style: {
          transform: [{translateX: value}, {scale: 2}],
        },
      });

      expect(nativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        jasmine.any(Number),
        {
          type: 'transform',
          transforms: [{
            nodeTag: jasmine.any(Number),
            property: 'translateX',
            type: 'animated',
          }, {
            value: 2,
            property: 'scale',
            type: 'static',
          }],
        },
      );
    });

    it('sends a valid graph description for Animated.diffClamp nodes', () => {
      const value = new Animated.Value(2);
      value.__makeNative();

      createAndMountComponent(Animated.View, {
        style: {
          opacity: Animated.diffClamp(value, 0, 20),
        },
      });

      expect(nativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        jasmine.any(Number),
        {type: 'diffclamp', input: jasmine.any(Number), max: 20, min: 0},
      );
      const diffClampCalls = nativeAnimatedModule.createAnimatedNode.mock.calls.filter(
        (call) => call[1].type === 'diffclamp'
      );
      expect(diffClampCalls.length).toBe(1);
      const diffClampCall = diffClampCalls[0];
      const diffClampNodeTag = diffClampCall[0];
      const diffClampConnectionCalls = nativeAnimatedModule.connectAnimatedNodes.mock.calls.filter(
        (call) => call[1] === diffClampNodeTag
      );
      expect(diffClampConnectionCalls.length).toBe(1);
      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(diffClampCall[1].input, {type: 'value', value: 2, offset: 0});
    });

    it('doesn\'t call into native API if useNativeDriver is set to false', () => {
      const anim = new Animated.Value(0);

      const c = createAndMountComponent(Animated.View, {
        style: {
          opacity: anim,
        },
      });

      Animated.timing(anim, {toValue: 10, duration: 1000, useNativeDriver: false}).start();

      c.componentWillUnmount();

      expect(nativeAnimatedModule.createAnimatedNode).not.toBeCalled();
    });

    it('fails when trying to run non-native animation on native node', () => {
      const anim = new Animated.Value(0);

      createAndMountComponent(Animated.View, {
        style: {
          opacity: anim,
        },
      });

      Animated.timing(anim, {toValue: 10, duration: 50, useNativeDriver: true}).start();
      jest.runAllTimers();

      Animated.timing(anim, {toValue: 4, duration: 500, useNativeDriver: false}).start();
      expect(jest.runAllTimers).toThrow();
    });

    it('fails for unsupported styles', () => {
      const anim = new Animated.Value(0);

      createAndMountComponent(Animated.View, {
        style: {
          left: anim,
        },
      });

      const animation = Animated.timing(anim, {toValue: 10, duration: 50, useNativeDriver: true});
      expect(animation.start).toThrowError(/left/);
    });

    it('works for any `static` props and styles', () => {
      // Passing "unsupported" props should work just fine as long as they are not animated
      const value = new Animated.Value(0);
      value.__makeNative();

      createAndMountComponent(Animated.View, {
        style: {
          left: 10,
          top: 20,
          opacity: value,
        },
        removeClippedSubviews: true,
      });

      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(jasmine.any(Number), { type: 'style', style: { opacity: jasmine.any(Number) }});
      expect(nativeAnimatedModule.createAnimatedNode)
        .toBeCalledWith(jasmine.any(Number), { type: 'props', props: { style: jasmine.any(Number) }});
    });
  });

  describe('Animations', () => {
    it('sends a valid timing animation description', () => {
      const anim = new Animated.Value(0);
      Animated.timing(anim, {toValue: 10, duration: 1000, useNativeDriver: true}).start();

      expect(nativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        {type: 'frames', frames: jasmine.any(Array), toValue: jasmine.any(Number), iterations: 1},
        jasmine.any(Function)
      );
    });

    it('sends a valid spring animation description', () => {
      const anim = new Animated.Value(0);
      Animated.spring(anim, {toValue: 10, friction: 5, tension: 164, useNativeDriver: true}).start();
      expect(nativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        {
          type: 'spring',
          stiffness: 679.08,
          damping: 16,
          mass: 1,
          initialVelocity: 0,
          overshootClamping: false,
          restDisplacementThreshold: 0.001,
          restSpeedThreshold: 0.001,
          toValue: 10,
          iterations: 1,
        },
        jasmine.any(Function)
      );

      Animated.spring(anim, {
        toValue: 10,
        stiffness: 1000,
        damping: 500,
        mass: 3,
        useNativeDriver: true
      }).start();
      expect(nativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        {
          type: 'spring',
          stiffness: 1000,
          damping: 500,
          mass: 3,
          initialVelocity: 0,
          overshootClamping: false,
          restDisplacementThreshold: 0.001,
          restSpeedThreshold: 0.001,
          toValue: 10,
          iterations: 1,
        },
        jasmine.any(Function)
      );

      Animated.spring(anim, {toValue: 10, bounciness: 8, speed: 10, useNativeDriver: true}).start();
      expect(nativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        {
          type: 'spring',
          damping: 23.05223140901191,
          initialVelocity: 0,
          overshootClamping: false,
          restDisplacementThreshold: 0.001,
          restSpeedThreshold: 0.001,
          stiffness: 299.61882352941177,
          mass: 1,
          toValue: 10,
          iterations: 1,
        },
        jasmine.any(Function)
      );
    });

    it('sends a valid decay animation description', () => {
      const anim = new Animated.Value(0);
      Animated.decay(anim, {velocity: 10, deceleration: 0.1, useNativeDriver: true}).start();

      expect(nativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        {type: 'decay', deceleration: 0.1, velocity: 10, iterations: 1},
        jasmine.any(Function)
      );
    });

    it('works with Animated.loop', () => {
      const anim = new Animated.Value(0);
      Animated.loop(
        Animated.decay(anim, {velocity: 10, deceleration: 0.1, useNativeDriver: true}),
        { iterations: 10 },
      ).start();

      expect(nativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        {type: 'decay', deceleration: 0.1, velocity: 10, iterations: 10},
        jasmine.any(Function)
      );
    });

    it('sends stopAnimation command to native', () => {
      const value = new Animated.Value(0);
      const animation = Animated.timing(value, {toValue: 10, duration: 50, useNativeDriver: true});

      animation.start();
      expect(nativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        {type: 'frames', frames: jasmine.any(Array), toValue: jasmine.any(Number), iterations: 1},
        jasmine.any(Function)
      );
      const animationId = nativeAnimatedModule.startAnimatingNode.mock.calls[0][0];

      animation.stop();
      expect(nativeAnimatedModule.stopAnimation).toBeCalledWith(animationId);
    });
  });
});

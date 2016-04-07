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
  .autoMockOff()
  .setMock('Text', {})
  .setMock('View', {})
  .setMock('Image', {})
  .setMock('React', {Component: class {}})
  .setMock('NativeModules', {
    NativeAnimatedModule: {},
  });

var Animated = require('Animated');

describe('Animated', () => {

  beforeEach(() => {
    var nativeAnimatedModule = require('NativeModules').NativeAnimatedModule;
    nativeAnimatedModule.createAnimatedNode = jest.genMockFunction();
    nativeAnimatedModule.connectAnimatedNodes = jest.genMockFunction();
    nativeAnimatedModule.disconnectAnimatedNodes = jest.genMockFunction();
    nativeAnimatedModule.startAnimatingNode = jest.genMockFunction();
    nativeAnimatedModule.setAnimatedNodeValue = jest.genMockFunction();
    nativeAnimatedModule.connectAnimatedNodeToView = jest.genMockFunction();
    nativeAnimatedModule.disconnectAnimatedNodeFromView = jest.genMockFunction();
    nativeAnimatedModule.dropAnimatedNode = jest.genMockFunction();

    // jest environment doesn't have cancelAnimationFrame :(
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = jest.genMockFunction();
    }
  });

  it('creates and detaches nodes', () => {
    var anim = new Animated.Value(0);

    var c = new Animated.View();
    c.props = {
      style: {
        opacity: anim,
      },
    };
    c.componentWillMount();

    Animated.timing(anim, {toValue: 10, duration: 1000, useNativeDriver: true}).start();

    c.componentWillUnmount();

    var nativeAnimatedModule = require('NativeModules').NativeAnimatedModule;
    expect(nativeAnimatedModule.createAnimatedNode.mock.calls.length).toBe(3);
    expect(nativeAnimatedModule.connectAnimatedNodes.mock.calls.length).toBe(2);

    expect(nativeAnimatedModule.startAnimatingNode).toBeCalledWith(
      jasmine.any(Number),
      {type: 'frames', frames: jasmine.any(Array), toValue: jasmine.any(Number)},
      jasmine.any(Function)
    );

    expect(nativeAnimatedModule.disconnectAnimatedNodes.mock.calls.length).toBe(2);
    expect(nativeAnimatedModule.dropAnimatedNode.mock.calls.length).toBe(2);
  });

  it('sends a valid description for value, style and props nodes', () => {
    var anim = new Animated.Value(0);

    var c = new Animated.View();
    c.props = {
      style: {
        opacity: anim,
      },
    };
    c.componentWillMount();

    Animated.timing(anim, {toValue: 10, duration: 1000, useNativeDriver: true}).start();

    var nativeAnimatedModule = require('NativeModules').NativeAnimatedModule;
    expect(nativeAnimatedModule.createAnimatedNode)
      .toBeCalledWith(jasmine.any(Number), { type: 'value', value: 0 });
    expect(nativeAnimatedModule.createAnimatedNode)
      .toBeCalledWith(jasmine.any(Number), { type: 'style', style: { opacity: jasmine.any(Number) }});
    expect(nativeAnimatedModule.createAnimatedNode)
      .toBeCalledWith(jasmine.any(Number), { type: 'props', props: { style: jasmine.any(Number) }});
  });

  it('sends a valid timing animation description', () => {
    var anim = new Animated.Value(0);
    Animated.timing(anim, {toValue: 10, duration: 1000, useNativeDriver: true}).start();

    var nativeAnimatedModule = require('NativeModules').NativeAnimatedModule;
    expect(nativeAnimatedModule.startAnimatingNode).toBeCalledWith(
      jasmine.any(Number),
      {type: 'frames', frames: jasmine.any(Array), toValue: jasmine.any(Number)},
      jasmine.any(Function)
    );
  });

  it('proxies `setValue` correctly', () => {
    var anim = new Animated.Value(0);
    Animated.timing(anim, {toValue: 10, duration: 1000, useNativeDriver: true}).start();

    anim.setValue(5);

    var nativeAnimatedModule = require('NativeModules').NativeAnimatedModule;
    expect(nativeAnimatedModule.setAnimatedNodeValue).toBeCalledWith(jasmine.any(Number), 5);
  });

  it('doesn\'t call into native API if useNativeDriver is set to false', () => {
    var anim = new Animated.Value(0);

    var c = new Animated.View();
    c.props = {
      style: {
        opacity: anim,
      },
    };
    c.componentWillMount();

    Animated.timing(anim, {toValue: 10, duration: 1000, useNativeDriver: false}).start();

    c.componentWillUnmount();

    expect(require('NativeModules').NativeAnimatedModule.createAnimatedNode).not.toBeCalled();
  });

  it('fails when trying to run non-native animation on native node', () => {
    var anim = new Animated.Value(0);

    var c = new Animated.View();
    c.props = {
      style: {
        opacity: anim,
      },
    };
    c.componentWillMount();

    Animated.timing(anim, {toValue: 10, duration: 50, useNativeDriver: true}).start();
    jest.runAllTimers();

    Animated.timing(anim, {toValue: 4, duration: 500, useNativeDriver: false}).start();
    expect(jest.runAllTimers).toThrow();
  });

  it('fails for unsupported prop types', () => {
    var anim = new Animated.Value(0);

    var c = new Animated.View();
    c.props = {
      style: {
        opacity: anim,
      },
      randomProperty: anim,
    };
    c.componentWillMount();

    var animation = Animated.timing(anim, {toValue: 10, duration: 50, useNativeDriver: true});
    expect(animation.start).toThrowError(/randomProperty/);
  });

  it('fails for unsupported styles', () => {
    var anim = new Animated.Value(0);

    var c = new Animated.View();
    c.props = {
      style: {
        left: anim,
      },
    };
    c.componentWillMount();

    var animation = Animated.timing(anim, {toValue: 10, duration: 50, useNativeDriver: true});
    expect(animation.start).toThrowError(/left/);
  });

  it('works for any `static` props and styles', () => {
    // Passing "unsupported" props should work just fine as long as they are not animated
    var anim = new Animated.Value(0);

    var node = new Animated.__PropsOnlyForTests({
      style: {
        left: 10,
        top: 20,
        opacity: anim,
      },
      removeClippedSubviews: true,
    });
    Animated.timing(anim, {toValue: 10, duration: 50, useNativeDriver: true}).start();
    node.__detach();

    var nativeAnimatedModule = require('NativeModules').NativeAnimatedModule;
    expect(nativeAnimatedModule.createAnimatedNode)
      .toBeCalledWith(jasmine.any(Number), { type: 'style', style: { opacity: jasmine.any(Number) }});
    expect(nativeAnimatedModule.createAnimatedNode)
      .toBeCalledWith(jasmine.any(Number), { type: 'props', props: { style: jasmine.any(Number) }});
  });

});

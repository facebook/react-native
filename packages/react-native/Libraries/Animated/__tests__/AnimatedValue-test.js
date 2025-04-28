/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

describe('AnimatedValue', () => {
  let NativeAnimatedHelper;
  let AnimatedValue;

  function createNativeAnimatedValue(): AnimatedValue {
    return new AnimatedValue(0, {useNativeDriver: true});
  }

  function emitMockUpdate(node: AnimatedValue, mockValue: number): void {
    const nativeTag = node.__nativeTag;
    expect(nativeTag).not.toBe(undefined);

    NativeAnimatedHelper.nativeEventEmitter.emit('onAnimatedValueUpdate', {
      tag: nativeTag,
      value: mockValue,
    });
  }

  beforeEach(() => {
    jest.resetModules();

    jest.mock('../NativeAnimatedTurboModule', () => ({
      __esModule: true,
      default: {
        addListener: jest.fn(),
        createAnimatedNode: jest.fn(),
        dropAnimatedNode: jest.fn(),
        removeListeners: jest.fn(),
        startListeningToAnimatedNodeValue: jest.fn(),
        stopListeningToAnimatedNodeValue: jest.fn(),
        extractAnimatedNodeOffset: jest.fn(),
        // ...
      },
    }));

    NativeAnimatedHelper =
      require('../../../src/private/animated/NativeAnimatedHelper').default;
    AnimatedValue = require('../nodes/AnimatedValue').default;

    jest.spyOn(NativeAnimatedHelper.API, 'createAnimatedNode');
    jest.spyOn(NativeAnimatedHelper.API, 'dropAnimatedNode');
    jest.spyOn(NativeAnimatedHelper.API, 'startListeningToAnimatedNodeValue');
    jest.spyOn(NativeAnimatedHelper.API, 'setWaitingForIdentifier');
    jest.spyOn(NativeAnimatedHelper.API, 'unsetWaitingForIdentifier');
  });

  it('emits update events for listeners added', () => {
    const callback = jest.fn();
    const node = createNativeAnimatedValue();
    node.__attach();
    const id = node.addListener(callback);

    const nativeTag = node.__nativeTag;
    expect(nativeTag).not.toBe(undefined);

    emitMockUpdate(node, 123);
    expect(callback).toBeCalledTimes(1);

    node.removeListener(id);

    emitMockUpdate(node, 456);
    expect(callback).toBeCalledTimes(1);
  });

  it('creates a native node when adding a listener', () => {
    const node = createNativeAnimatedValue();
    node.__attach();
    expect(NativeAnimatedHelper.API.createAnimatedNode).not.toBeCalled();

    const id = node.addListener(jest.fn());
    node.removeListener(id);
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(1);
  });

  it('drops a created native node on detach', () => {
    const node = createNativeAnimatedValue();
    node.__attach();
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(0);

    node.addListener(jest.fn());
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(1);
    expect(NativeAnimatedHelper.API.dropAnimatedNode).toBeCalledTimes(0);

    node.__detach();
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(1);
    expect(NativeAnimatedHelper.API.dropAnimatedNode).toBeCalledTimes(1);
  });

  it('emits update events for listeners added after re-attach', () => {
    const callbackA = jest.fn();
    const node = createNativeAnimatedValue();
    node.__attach();

    node.addListener(callbackA);
    emitMockUpdate(node, 123);
    expect(callbackA).toBeCalledTimes(1);

    node.__detach();
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(1);

    const callbackB = jest.fn();
    node.__attach();
    node.addListener(callbackB);

    emitMockUpdate(node, 456);
    expect(callbackA).toBeCalledTimes(1);
    expect(callbackB).toBeCalledTimes(1);
  });

  describe('when NativeAnimatedHelper.API.startListeningToAnimatedNodeValue is called', () => {
    it('starts listening when addListener is called after __makeNative', () => {
      const node = new AnimatedValue(0, {useNativeDriver: false});

      node.__makeNative();
      expect(
        NativeAnimatedHelper.API.startListeningToAnimatedNodeValue,
      ).toBeCalledTimes(0);

      node.addListener(() => {});

      expect(
        NativeAnimatedHelper.API.startListeningToAnimatedNodeValue,
      ).toBeCalledTimes(1);
    });

    it('starts listening when __makeNative is called after addListener', () => {
      const node = new AnimatedValue(0, {useNativeDriver: false});

      node.addListener(() => {});

      expect(
        NativeAnimatedHelper.API.startListeningToAnimatedNodeValue,
      ).toBeCalledTimes(0);

      node.__makeNative();

      expect(
        NativeAnimatedHelper.API.startListeningToAnimatedNodeValue,
      ).toBeCalledTimes(1);
    });

    it('does not start listening to node when not native', () => {
      const node = new AnimatedValue(0, {useNativeDriver: false});

      node.__attach();
      expect(
        NativeAnimatedHelper.API.startListeningToAnimatedNodeValue,
      ).toBeCalledTimes(0);

      node.addListener(() => {});

      expect(
        NativeAnimatedHelper.API.startListeningToAnimatedNodeValue,
      ).toBeCalledTimes(0);
    });
  });

  describe('when extractOffset is called', () => {
    it('flushes changes to native immediately when native', () => {
      const node = new AnimatedValue(0, {useNativeDriver: true});

      expect(NativeAnimatedHelper.API.setWaitingForIdentifier).toBeCalledTimes(
        0,
      );
      expect(
        NativeAnimatedHelper.API.unsetWaitingForIdentifier,
      ).toBeCalledTimes(0);

      node.extractOffset();

      expect(NativeAnimatedHelper.API.setWaitingForIdentifier).toBeCalledTimes(
        1,
      );
      expect(
        NativeAnimatedHelper.API.unsetWaitingForIdentifier,
      ).toBeCalledTimes(1);
    });

    it('does not flush changes when not native', () => {
      const node = new AnimatedValue(0, {useNativeDriver: false});

      node.extractOffset();

      expect(NativeAnimatedHelper.API.setWaitingForIdentifier).toBeCalledTimes(
        0,
      );
      expect(
        NativeAnimatedHelper.API.unsetWaitingForIdentifier,
      ).toBeCalledTimes(0);
    });
  });
});

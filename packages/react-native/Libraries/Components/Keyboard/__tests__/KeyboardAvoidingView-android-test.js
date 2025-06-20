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

'use strict';

import type {Layout} from '../../../Types/CoreEventTypes';
import type {ReactTestInstance} from '../../../Utilities/ReactNativeTestTools';
import type {KeyboardEvent, KeyboardEventName} from '../Keyboard';

const render = require('../../../../jest/renderer');
const EventEmitter = require('../../../vendor/emitter/EventEmitter').default;
const TextInput = require('../../TextInput/TextInput');
const View = require('../../View/View');
const KeyboardAvoidingView = require('../KeyboardAvoidingView').default;
const React = require('react');
const TestRenderer = require('react-test-renderer');

const mockKeyboardEmitter = new EventEmitter<{
  [key: KeyboardEventName]: [KeyboardEvent],
}>();

jest.mock('../../../Utilities/Platform', () => ({
  OS: 'android',
}));

jest.mock('../Keyboard', () => ({
  addListener: jest.fn().mockImplementation((event, callback) => {
    return mockKeyboardEmitter.addListener(event, callback);
  }),
  removeAllListeners: jest.fn(),
  dismiss: jest.fn(),
  isVisible: jest.fn(),
  metrics: jest.fn(),
  scheduleLayoutAnimation: jest.fn(),
}));

describe('KeyboardAvoidingView - Platform.OS=android, behavior=height', () => {
  const SCREEN_HEIGHT = 500;
  const SCREEN_WIDTH = 100;
  const KEYBOARD_HEIGHT = 200;
  const BEHAVIOR = 'height';

  it('should adjust height when keyboard is shown', async () => {
    const output = await render.create(
      <KeyboardAvoidingView behavior={BEHAVIOR}>
        <TextInput />
      </KeyboardAvoidingView>,
    );

    const instance = output.root.findByType(KeyboardAvoidingView);

    await dispatchOnLayoutAsync(instance, {
      x: 0,
      y: 0,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });

    await setKeyboardVisibleAsync({
      instance,
      isVisible: true,
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
      keyboardHeight: KEYBOARD_HEIGHT,
    });

    const view = instance.findByType(View);
    expect(view.props.style.height).toBe(SCREEN_HEIGHT - KEYBOARD_HEIGHT);
  });

  it('should adjust height back when keyboard is hidden', async () => {
    const output = await render.create(
      <KeyboardAvoidingView behavior={BEHAVIOR}>
        <TextInput />
      </KeyboardAvoidingView>,
    );

    const instance = output.root.findByType(KeyboardAvoidingView);

    await dispatchOnLayoutAsync(instance, {
      x: 0,
      y: 0,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });

    await setKeyboardVisibleAsync({
      instance,
      isVisible: true,
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
      keyboardHeight: KEYBOARD_HEIGHT,
    });

    const view = instance.findByType(View);
    expect(view.props.style?.height ?? 0).toBe(SCREEN_HEIGHT - KEYBOARD_HEIGHT);

    await setKeyboardVisibleAsync({
      instance,
      isVisible: false,
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
      keyboardHeight: KEYBOARD_HEIGHT,
    });

    const height = view.props.style?.height ?? 0;
    expect(height).toBe(0);
  });

  it('should adjust height back when keyboard is hidden (with keyboardVerticalOffset)', async () => {
    const keyboardVerticalOffset = 30;
    const output = await render.create(
      <KeyboardAvoidingView
        behavior={BEHAVIOR}
        keyboardVerticalOffset={keyboardVerticalOffset}>
        <TextInput />
      </KeyboardAvoidingView>,
    );

    const instance = output.root.findByType(KeyboardAvoidingView);

    await dispatchOnLayoutAsync(instance, {
      x: 0,
      y: 0,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });

    await setKeyboardVisibleAsync({
      instance,
      isVisible: true,
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
      keyboardHeight: KEYBOARD_HEIGHT,
    });

    const view = instance.findByType(View);
    expect(view.props.style?.height ?? 0).toBe(
      SCREEN_HEIGHT - KEYBOARD_HEIGHT - keyboardVerticalOffset,
    );

    await setKeyboardVisibleAsync({
      instance,
      isVisible: false,
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
      keyboardHeight: KEYBOARD_HEIGHT,
    });

    const height = view.props.style?.height ?? 0;
    expect(height).toBe(0);
  });

  it('should adjust determistic height when keyboard is shown from non-integer screen height and keyboardVerticalOffset', async () => {
    const screenHeight = 840;
    const keyboardHeight = 312.3809509277344;
    const keyboardVerticalOffset = 20;

    const output = await render.create(
      <KeyboardAvoidingView
        behavior={BEHAVIOR}
        keyboardVerticalOffset={keyboardVerticalOffset}>
        <TextInput />
      </KeyboardAvoidingView>,
    );

    const instance = output.root.findByType(KeyboardAvoidingView);
    const setStateSpy = jest.spyOn(instance.instance, 'setState');

    await dispatchOnLayoutAsync(instance, {
      x: 0,
      y: 0,
      width: SCREEN_WIDTH,
      height: screenHeight,
    });

    await setKeyboardVisibleAsync({
      instance,
      isVisible: true,
      screenWidth: SCREEN_WIDTH,
      screenHeight,
      keyboardHeight,
    });

    // Accumulate all the bottom values set by setState because KeyboardAvoidingView calls setState inside componentDidUpdate,
    // which can be called multiple times in a single test.
    const setStateBottomSet = new Set<number>();
    for (const call of setStateSpy.mock.calls) {
      setStateBottomSet.add(call[0].bottom);
    }
    expect(setStateBottomSet.size).toBeLessThanOrEqual(2);
  });

  //#region - Helper functions

  /**
   * Helper function to dispatch an onLayout event to a KeyboardAvoidingView
   */
  async function dispatchOnLayoutAsync(
    keyboardAvoidingViewInstance: ReactTestInstance,
    layout: Layout,
  ) {
    const {onLayout} = keyboardAvoidingViewInstance.findByType(View).props;
    await TestRenderer.act(async () => {
      onLayout({
        persist: jest.fn(),
        nativeEvent: {
          layout,
        },
      });
    });
  }

  /**
   * Helper function to dispatch a keyboard event.
   */
  async function dispatchKeyboardEventAsync(
    name: KeyboardEventName,
    coordinates: {
      screenX: number,
      screenY: number,
      width: number,
      height: number,
    },
  ) {
    await TestRenderer.act(async () => {
      mockKeyboardEmitter.emit(name, {
        duration: 0,
        easing: 'keyboard',
        endCoordinates: coordinates,
      });
    });
  }

  /**
   * Higher level helper function to set keyboard visibility and send onLayout event
   */
  async function setKeyboardVisibleAsync({
    instance,
    isVisible,
    screenWidth,
    screenHeight,
    keyboardHeight,
  }: {
    instance: ReactTestInstance,
    isVisible: boolean,
    screenWidth: number,
    screenHeight: number,
    keyboardHeight: number,
  }) {
    if (isVisible) {
      await dispatchKeyboardEventAsync('keyboardDidShow', {
        screenX: screenWidth,
        screenY: screenHeight - keyboardHeight,
        width: screenWidth,
        height: keyboardHeight,
      });
      const {width, height} = measureViewSize({
        instance,
        screenWidth,
        screenHeight,
      });
      await dispatchOnLayoutAsync(instance, {
        x: 0,
        y: 0,
        width,
        height,
      });
    } else {
      await dispatchKeyboardEventAsync('keyboardDidHide', {
        screenX: screenWidth,
        screenY: screenHeight,
        width: 0,
        height: 0,
      });
      const {width, height} = measureViewSize({
        instance,
        screenWidth,
        screenHeight,
      });
      await dispatchOnLayoutAsync(instance, {
        x: 0,
        y: 0,
        width,
        height,
      });
    }
  }

  /**
   * Helper function to simulate the platform measuring for a view
   */
  function measureViewSize({
    instance,
    screenWidth,
    screenHeight,
    screenDesnity = 3,
  }: {
    instance: ReactTestInstance,
    screenWidth: number,
    screenHeight: number,
    screenDesnity?: number,
  }): {width: number, height: number} {
    const view = instance.findByType(View);
    const {style} = view.props;
    const height = style?.height || screenHeight;

    return {
      // ReactAndroid converts the size between pixels and dp and can have a round-off error.
      // To simulate this, we round the width and height to the nearest pixel.
      width: Math.floor(screenWidth * screenDesnity) / screenDesnity,
      height: Math.floor(height * screenDesnity) / screenDesnity,
    };
  }

  //#endregion - Helper functions
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {create, unmount} from '@react-native/jest-preset/jest/renderer';
import * as React from 'react';
import {Modal, Platform, StyleSheet} from 'react-native';
import TestRenderer from 'react-test-renderer';

const {examples} = require('../SafeAreaInsetsExample');

const geometry = examples.find(example => example.name === 'geometry');

it.each(['android', 'ios'])(
  'displays independent inset measurements without applying padding on %s',
  async platform => {
    if (geometry == null) {
      throw new Error('The scaled safe-area example is missing.');
    }
    expect(geometry.platform).toBeUndefined();
    const originalPlatform = Object.getOwnPropertyDescriptor(Platform, 'OS');
    if (originalPlatform == null) {
      throw new Error('The platform mock is missing.');
    }
    const Example = geometry.render;
    const renderer = await create(<Example />);
    Object.defineProperty(Platform, 'OS', {
      value: platform,
      configurable: true,
    });
    try {
      const button = renderer.root.findByProps({title: 'Scale 2'});
      await TestRenderer.act(() => button.props.onPress());
      const root = renderer.root.findByProps({
        testID: 'safe-area-geometry-root',
      });
      const expectedInsets = {top: 24, right: 12, bottom: 20, left: 8};
      await TestRenderer.act(() => {
        root.props.onLayout({nativeEvent: {layout: {width: 360, height: 800}}});
        root.props.experimental_onSafeAreaInsetsChange({
          nativeEvent: {insets: expectedInsets},
        });
      });
      const observer = renderer.root.findByProps({
        testID: 'safe-area-geometry-observer',
      });
      const expectedObserverStyle = {
        position: 'absolute',
        backgroundColor: '#ff9999',
        left: 90,
        top: 200,
        width: 180,
        height: 400,
        transform: [{scale: 2}],
      };
      expect(StyleSheet.flatten(observer.props.style)).toEqual(
        expectedObserverStyle,
      );
      const readInsets = (testID: string): unknown => {
        const text: unknown = renderer.root.findByProps({testID}).props
          .children;
        if (typeof text !== 'string') {
          throw new Error('The inset readout is missing.');
        }
        return JSON.parse(text.slice(text.indexOf('{')));
      };
      const distinctInsets = {top: 12, right: 6, bottom: 10, left: 4};
      await TestRenderer.act(() => {
        observer.props.experimental_onSafeAreaInsetsChange({
          nativeEvent: {insets: distinctInsets},
        });
      });
      expect(readInsets('safe-area-root-insets')).toEqual(expectedInsets);
      expect(readInsets('safe-area-observer-insets')).toEqual(distinctInsets);
      await TestRenderer.act(() => {
        observer.props.experimental_onSafeAreaInsetsChange({
          nativeEvent: {insets: expectedInsets},
        });
      });
      expect(readInsets('safe-area-root-insets')).toEqual(expectedInsets);
      expect(readInsets('safe-area-observer-insets')).toEqual(expectedInsets);
      const units = platform === 'ios' ? 'pt' : 'dp';
      expect(
        renderer.root.findByProps({testID: 'safe-area-root-insets'}).props
          .children,
      ).toContain(`Root (1×), ${units}:`);
      expect(
        renderer.root.findByProps({testID: 'safe-area-observer-insets'}).props
          .children,
      ).toContain(`Observer (2×), ${units}:`);
      expect(StyleSheet.flatten(root.props.style)).toEqual({
        flex: 1,
        backgroundColor: 'white',
      });
      expect(StyleSheet.flatten(observer.props.style)).toEqual(
        expectedObserverStyle,
      );
      const close = renderer.root.findByProps({title: 'Close'});
      await TestRenderer.act(() => close.props.onPress());
      expect(renderer.root.findByType(Modal).props.visible).toBe(false);
    } finally {
      Reflect.defineProperty(Platform, 'OS', originalPlatform);
      await unmount(renderer);
    }
  },
);

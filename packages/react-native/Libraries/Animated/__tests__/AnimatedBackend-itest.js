/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags useSharedAnimatedBackend:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import {createRef} from 'react';
import {Animated, useAnimatedValue} from 'react-native';
import {allowStyleProp} from 'react-native/Libraries/Animated/NativeAnimatedAllowlist';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

test('animated opacity', () => {
  let _opacity;
  let _opacityAnimation;
  const viewRef = createRef<HostInstance>();

  function MyApp() {
    const opacity = useAnimatedValue(1);
    _opacity = opacity;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: 100,
            height: 100,
            opacity: opacity,
          },
        ]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const viewElement = ensureInstance(viewRef.current, ReactNativeElement);

  expect(viewElement.getBoundingClientRect().x).toBe(0);

  Fantom.runTask(() => {
    _opacityAnimation = Animated.timing(_opacity, {
      toValue: 0,
      duration: 30,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(30);
  expect(Fantom.unstable_getDirectManipulationProps(viewElement).opacity).toBe(
    0,
  );

  // TODO: this shouldn't be neccessary since animation should be stopped after duration
  Fantom.runTask(() => {
    _opacityAnimation?.stop();
  });

  expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
    <rn-view opacity="0" />,
  );
});

test('animate layout props', () => {
  const viewRef = createRef<HostInstance>();
  allowStyleProp('height');

  let _animatedHeight;
  let _heightAnimation;

  function MyApp() {
    const animatedHeight = useAnimatedValue(0);
    _animatedHeight = animatedHeight;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: 100,
            height: animatedHeight,
          },
        ]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  Fantom.runTask(() => {
    _heightAnimation = Animated.timing(_animatedHeight, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(100);

  // TODO: getFabricUpdateProps is not working with the cloneMutliple method
  // expect(Fantom.unstable_getFabricUpdateProps(viewElement).height).toBe(100);
  expect(root.getRenderedOutput({props: ['height']}).toJSX()).toEqual(
    <rn-view height="50.000000" />,
  );

  Fantom.unstable_produceFramesForDuration(100);

  // TODO: this shouldn't be neccessary since animation should be stopped after duration
  Fantom.runTask(() => {
    _heightAnimation?.stop();
  });

  expect(root.getRenderedOutput({props: ['height']}).toJSX()).toEqual(
    <rn-view height="100.000000" />,
  );
});

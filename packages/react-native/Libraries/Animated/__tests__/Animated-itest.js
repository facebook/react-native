/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import {createRef} from 'react';
import {Animated, useAnimatedValue} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

test('moving box by 100 points', () => {
  let _translateX;
  const viewRef = createRef<HostInstance>();

  function MyApp() {
    const translateX = useAnimatedValue(0);
    _translateX = translateX;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: 100,
            height: 100,
            backgroundColor: 'red',
          },
          {transform: [{translateX}]},
        ]}
        testID="box"
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
    Animated.timing(_translateX, {
      toValue: 100,
      duration: 1000, // 1 second
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500);

  // shadow tree is not synchronised yet, position X is still 0.
  expect(viewElement.getBoundingClientRect().x).toBe(0);

  const transform =
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(viewElement).transform[0];

  // direct manipulation has been applied. 50% through the animation
  // and with linear animation, that is position X = 50.
  expect(transform.translateX).toBeCloseTo(50, 0.001);

  Fantom.unstable_produceFramesForDuration(500);

  // Animation is completed now. C++ Animated will commit the final position to the shadow tree.
  expect(viewElement.getBoundingClientRect().x).toBe(100);

  // TODO: this shouldn't be needed but C++ Animated still schedules a React state update
  // for synchronisation, even though it doesn't need to.
  Fantom.runWorkLoop();
  expect(viewElement.getBoundingClientRect().x).toBe(100);
});

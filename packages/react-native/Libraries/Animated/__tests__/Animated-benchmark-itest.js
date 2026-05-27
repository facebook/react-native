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

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Animated, View, useAnimatedValue} from 'react-native';

function MyApp() {
  return (
    <View
      style={[
        {
          width: 100,
          height: 100,
          opacity: 1,
        },
      ]}
    />
  );
}

function MyAnimatedApp() {
  return (
    <Animated.View
      style={[
        {
          width: 100,
          height: 100,
          opacity: 1,
        },
      ]}
    />
  );
}

function MyAnimatedAppWithAnimation() {
  const opacity = useAnimatedValue(1);

  return (
    <Animated.View
      style={[
        {
          width: 100,
          height: 100,
          opacity,
        },
      ]}
    />
  );
}

function MyAnimatedAppWithNativeAnimation() {
  const opacity = useAnimatedValue(1, {useNativeDriver: true});

  return (
    <Animated.View
      style={[
        {
          width: 100,
          height: 100,
          opacity,
        },
      ]}
    />
  );
}

const ARGS = [1, 10, 100];

let root = Fantom.createRoot();
let element: React.MixedElement;

function renderElement() {
  Fantom.runTask(() => root.render(element));
}

function getOptions(
  numberOfComponents: number,
  Component: React.ComponentType<{}>,
): Fantom.BenchmarkTestOptions {
  return {
    beforeAll: () => {
      element = (
        <>
          {Array.from({length: numberOfComponents}, (_, i) => (
            <Component key={i} />
          ))}
        </>
      );
    },
    beforeEach: () => {
      Fantom.runTask(() => root.render(<></>));
    },
  };
}

Fantom.unstable_benchmark
  .suite('Animated')
  .test.each(
    ARGS,
    n => `render ${n} views`,
    renderElement,
    n => getOptions(n, MyApp),
  )
  .test.each(
    ARGS,
    n => `render ${n} animated views (without animations set up)`,
    renderElement,
    n => getOptions(n, MyAnimatedApp),
  )
  .test.each(
    ARGS,
    n =>
      `render ${n} animated views (with a single animation set up - JS driven)`,
    renderElement,
    n => getOptions(n, MyAnimatedAppWithAnimation),
  )
  .test.each(
    ARGS,
    n =>
      `render ${n} animated views (with a single animation set up - native driven)`,
    renderElement,
    n => getOptions(n, MyAnimatedAppWithNativeAnimation),
  );

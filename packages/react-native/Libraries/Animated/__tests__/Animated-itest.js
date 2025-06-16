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
import {Animated, View, useAnimatedValue} from 'react-native';
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
          },
          {transform: [{translateX}]},
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

test('animation driven by onScroll event', () => {
  const scrollViewRef = createRef<HostInstance>();
  const viewRef = createRef<HostInstance>();

  function PressableWithNativeDriver() {
    const currScroll = useAnimatedValue(0);

    return (
      <View style={{flex: 1}}>
        <Animated.View
          ref={viewRef}
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            transform: [{translateY: currScroll}],
          }}
        />
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: {
                    y: currScroll,
                  },
                },
              },
            ],
            {useNativeDriver: true},
          )}>
          <View style={{height: 1000, width: 100}} />
        </Animated.ScrollView>
      </View>
    );
  }

  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<PressableWithNativeDriver />);
  });

  const scrollViewelement = ensureInstance(
    scrollViewRef.current,
    ReactNativeElement,
  );
  const viewElement = ensureInstance(viewRef.current, ReactNativeElement);

  Fantom.scrollTo(scrollViewelement, {
    x: 0,
    y: 100,
  });

  let transform =
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(viewElement).transform[0];

  expect(transform.translateY).toBeCloseTo(100, 0.001);

  // TODO(T226364699): this should `toBe(100)` but we are not syncing shadow tree yet.
  expect(viewElement.getBoundingClientRect().y).toBe(0);
});

test('animated opacity', () => {
  let _opacity;
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
    Animated.timing(_opacity, {
      toValue: 0,
      duration: 30,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(30);
  // $FlowFixMe[incompatible-use]
  expect(Fantom.unstable_getDirectManipulationProps(viewElement).opacity).toBe(
    0,
  );

  // TODO: this shouldn't be neccessary but C++ Animated still schedules a React state update.
  Fantom.runWorkLoop();

  expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
    <rn-view opacity="0" />,
  );
});

test('moving box by 50 points with offset 10', () => {
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
          },
          {transform: [{translateX}]},
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

  let finishValue = null;

  Fantom.runTask(() => {
    Animated.timing(_translateX, {
      toValue: 50,
      duration: 1000, // 1 second
      useNativeDriver: true,
    }).start(result => {
      finishValue = result;
    });
  });

  Fantom.runTask(() => {
    _translateX.setOffset(10);
  });

  Fantom.unstable_produceFramesForDuration(500);

  // shadow tree is not synchronised yet, position X is still 0.
  expect(viewElement.getBoundingClientRect().x).toBe(0);

  expect(
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(viewElement).transform[0]
      .translateX,
  ).toBeCloseTo(35, 0.001);

  Fantom.unstable_produceFramesForDuration(500);

  expect(
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(viewElement).transform[0]
      .translateX,
  ).toBeCloseTo(60, 0.001);

  expect(root.getRenderedOutput({props: ['transform']}).toJSX()).toEqual(
    <rn-view transform='[{"translateX": 60.000000}]' />,
  );

  // TODO: this shouldn't be neccessary but C++ Animated still schedules a React state update.
  Fantom.runWorkLoop();

  expect(root.getRenderedOutput({props: ['transform']}).toJSX()).toEqual(
    <rn-view transform='[{"translateX": 60.000000}]' />, // // must include offset.
  );

  expect(finishValue?.finished).toBe(true);
  expect(finishValue?.value).toBe(50); // must not include offset.
  expect(finishValue?.offset).toBe(10);
});

describe('Value.flattenOffset', () => {
  it('accumulates offset with onScroll value', () => {
    const scrollViewRef = createRef<HostInstance>();
    const viewRef = createRef<HostInstance>();
    let _onScroll;

    function PressableWithNativeDriver() {
      _onScroll = useAnimatedValue(0);

      return (
        <View style={{flex: 1}}>
          <Animated.View
            ref={viewRef}
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              transform: [{translateY: _onScroll}],
            }}
          />
          <Animated.ScrollView
            ref={scrollViewRef}
            onScroll={Animated.event(
              [
                {
                  nativeEvent: {
                    contentOffset: {
                      y: _onScroll,
                    },
                  },
                },
              ],
              {useNativeDriver: true},
            )}>
            <View style={{height: 1000, width: 100}} />
          </Animated.ScrollView>
        </View>
      );
    }

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<PressableWithNativeDriver />);
    });

    const scrollViewelement = ensureInstance(
      scrollViewRef.current,
      ReactNativeElement,
    );
    const viewElement = ensureInstance(viewRef.current, ReactNativeElement);

    Fantom.scrollTo(scrollViewelement, {
      x: 0,
      y: 10,
    });

    Fantom.runTask(() => {
      _onScroll.setOffset(15);
      _onScroll.flattenOffset();
    });

    Fantom.runTask(() => {
      _onScroll.setOffset(15);
    });

    let transform =
      // $FlowFixMe[incompatible-use]
      Fantom.unstable_getDirectManipulationProps(viewElement).transform[0];

    expect(transform.translateY).toBeCloseTo(40, 0.001);

    // TODO: this shouldn't be neccessary.
    Fantom.runWorkLoop();
  });
});

describe('Value.extractOffset', () => {
  it('sets the offset value to the base value and resets the base value to zero', () => {
    const scrollViewRef = createRef<HostInstance>();
    const viewRef = createRef<HostInstance>();
    let _onScroll;

    function PressableWithNativeDriver() {
      _onScroll = useAnimatedValue(0);

      return (
        <View style={{flex: 1}}>
          <Animated.View
            ref={viewRef}
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              transform: [{translateY: _onScroll}],
            }}
          />
          <Animated.ScrollView
            ref={scrollViewRef}
            onScroll={Animated.event(
              [
                {
                  nativeEvent: {
                    contentOffset: {
                      y: _onScroll,
                    },
                  },
                },
              ],
              {useNativeDriver: true},
            )}>
            <View style={{height: 1000, width: 100}} />
          </Animated.ScrollView>
        </View>
      );
    }

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<PressableWithNativeDriver />);
    });

    const scrollViewelement = ensureInstance(
      scrollViewRef.current,
      ReactNativeElement,
    );
    const viewElement = ensureInstance(viewRef.current, ReactNativeElement);

    Fantom.scrollTo(scrollViewelement, {
      x: 0,
      y: 10,
    });

    Fantom.runTask(() => {
      _onScroll.setOffset(15);
      // Sets offset to be 15 + 10 = 25 (this is not observable from JS).
      _onScroll.extractOffset();
    });

    let transform =
      // $FlowFixMe[incompatible-use]
      Fantom.unstable_getDirectManipulationProps(viewElement).transform[0];

    // Animated value is now 0 but offset is 25. The final value is 25.
    expect(transform.translateY).toBeCloseTo(25, 0.001);

    Fantom.runTask(() => {
      // Sets offset 35, overriding the previous `setOffset`.
      // Due to `extractOffset`, base value was restarted to 0.
      _onScroll.setOffset(35);
    });

    transform =
      // $FlowFixMe[incompatible-use]
      Fantom.unstable_getDirectManipulationProps(viewElement).transform[0];

    // `extractOffset` resets value back to 0.
    // Previously we set offset to 35. The final value is 35.
    expect(transform.translateY).toBeCloseTo(35, 0.001);

    // TODO: this shouldn't be neccessary.
    Fantom.runWorkLoop();
  });
});

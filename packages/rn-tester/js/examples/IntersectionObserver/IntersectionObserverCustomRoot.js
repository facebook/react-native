/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {HostInstance} from 'react-native';

import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import * as React from 'react';
import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {PanResponder, StyleSheet, Text, View} from 'react-native';

export const name = 'IntersectionObserver Custom Root Example';
export const title = name;
export const description =
  'Move target to see intersection ratio with custom observation root change';

export function render(): React.Node {
  return <IntersectionObserverCustomRootExample />;
}

/**
 * Showcase threshold of two overlapping elements
 */
function IntersectionObserverCustomRootExample(): React.Node {
  const theme = useContext(RNTesterThemeContext);
  const rootRef = useRef<?HostInstance>(null);
  const targetRef = useRef<?HostInstance>(null);
  const [position, setPosition] = useState({left: 20, top: 20});
  const [intersectionRatio, setIntersectionRatio] = useState(0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (evt, gestureState) => {
          setPosition({
            left: position.left + gestureState.dx,
            top: position.top + gestureState.dy,
          });
        },
      }),
    [position],
  );
  const onObserve = useCallback(
    (entries: $ReadOnlyArray<IntersectionObserverEntry>) => {
      entries.forEach(entry => {
        setIntersectionRatio(entry.intersectionRatio);
      });
    },
    [],
  );

  const observer = useRef<?IntersectionObserver>(null);
  useLayoutEffect(() => {
    const rootNode = rootRef.current;
    const targetNode = targetRef.current;

    if (rootNode == null || targetNode == null) {
      return;
    }

    observer.current = new IntersectionObserver(onObserve, {
      // $FlowFixMe[incompatible-call]
      root: rootNode,
    });
    // $FlowFixMe[incompatible-call]
    observer.current.observe(targetNode);
    return () => {
      if (rootNode == null || targetNode == null) {
        observer.current?.disconnect();
      }
      // $FlowFixMe[incompatible-call]
      observer.current?.unobserve(targetNode);
    };
  }, [position, onObserve]);

  const textStyle = useMemo(() => {
    // eslint-disable-next-line no-labels
    color: theme.LabelColor;
  }, [theme]);

  return (
    <View
      style={[
        styles.container,
        styles.center,
        {backgroundColor: theme.SystemBackgroundColor},
      ]}>
      <View
        ref={rootRef}
        style={[
          styles.root,
          styles.center,
          {backgroundColor: theme.SystemFillColor},
        ]}>
        <Text style={textStyle}>Root</Text>
        <View
          {...panResponder.panHandlers}
          ref={targetRef}
          style={[
            styles.target,
            styles.center,
            {
              backgroundColor: theme.SecondarySystemFillColor,
              transform: [
                {translateX: position.left},
                {translateY: position.top},
              ],
            },
          ]}>
          <Text style={textStyle}>Target: Drag Me Around</Text>
          <Text style={textStyle}>
            Intersection Ratio: {`${Math.floor(intersectionRatio * 100)}%`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  root: {
    width: '60%',
    height: '50%',
  },
  target: {padding: 10, position: 'absolute'},
});

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

import * as React from 'react';
import {useCallback, useLayoutEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

export const name = 'IntersectionObserver Parent Clipping Example';
export const title = name;
export const description = 'A clipping parent clips both the root and target';

export function render(): React.Node {
  return <IntersectionObserverCustomClippingRootExample />;
}

/**
 * Showcase threshold of two overlapping elements
 */
function IntersectionObserverCustomClippingRootExample(): React.Node {
  const rootRef = useRef<?HostInstance>(null);
  const targetRef = useRef<?HostInstance>(null);
  const [intersectionEntry, setIntersectionEntry] =
    useState<?IntersectionObserverEntry>(null);

  const onObserve = useCallback(
    (entries: $ReadOnlyArray<IntersectionObserverEntry>) => {
      entries.forEach(entry => {
        setIntersectionEntry(entry);
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
  }, [onObserve]);

  return (
    <>
      <View style={[styles.clippingParent]}>
        <View ref={rootRef} style={styles.root}>
          <View ref={targetRef} style={styles.target} />
        </View>
      </View>
      <Text>
        There is a clipping parent around the root and target. Blue box is the
        observation root, yellow box (clipped) is target
      </Text>
      {intersectionEntry != null && (
        <>
          <Text>
            intersecting: {intersectionEntry.isIntersecting.toString()}
          </Text>
          <Text>
            intersection rect:{' '}
            {JSON.stringify(intersectionEntry.intersectionRect)}
          </Text>
          <Text>
            client rect: {JSON.stringify(intersectionEntry.boundingClientRect)}
          </Text>
          <Text>root rect: {JSON.stringify(intersectionEntry.rootBounds)}</Text>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  clippingParent: {
    height: 100,
    width: 100,
    overflow: 'hidden',
  },
  root: {
    backgroundColor: 'blue',
    height: 300,
    width: 300,
  },
  target: {
    backgroundColor: 'yellow',
    marginTop: 100,
    height: 100,
    width: 100,
  },
});

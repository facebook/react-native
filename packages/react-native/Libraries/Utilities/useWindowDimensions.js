/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Dimensions from './Dimensions';
import {
  type DisplayMetrics,
  type DisplayMetricsAndroid,
} from './NativeDeviceInfo';
import {useCallback, useRef, useSyncExternalStore} from 'react';

type DisplayMetricsUnion = DisplayMetrics | DisplayMetricsAndroid;

const defaultSelector = (state: DisplayMetricsUnion): DisplayMetricsUnion =>
  state;

const hasWindowChanged = <T = DisplayMetricsUnion>(
  prev: T,
  next: T,
): boolean => {
  // When dev called `useWindowDimensions()` without selector
  if (
    typeof next === 'object' &&
    next != null &&
    typeof prev === 'object' &&
    prev != null
  ) {
    return (
      prev.width !== next.width ||
      prev.height !== next.height ||
      prev.scale !== next.scale ||
      prev.fontScale !== next.fontScale
    );
  }

  // When dev called `useWindowDimensions(state => state.fontScale)` with a selector fn.
  return !Object.is(prev, next);
};

const getSnapshot = () => Dimensions.get('window');

const subscribe = (callback: () => void) => {
  const subscription = Dimensions.addEventListener('change', callback);
  return () => subscription.remove();
};

export default function useWindowDimensions<T = DisplayMetricsUnion>(
  // $FlowFixMe[incompatible-type]
  selector: (state: DisplayMetricsUnion) => T = defaultSelector,
): T {
  // $FlowFixMe[incompatible-type]
  const prevRef = useRef<T>();

  const getSnapshotWithSelector = useCallback((): T => {
    const prev = prevRef.current;
    const next = selector(getSnapshot());
    if (hasWindowChanged<T>(prev, next)) {
      prevRef.current = next;
    }
    return prevRef.current;
  }, [selector]);

  return useSyncExternalStore(subscribe, getSnapshotWithSelector);
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import Dimensions from './Dimensions';
import {
  type DisplayMetrics,
  type DisplayMetricsAndroid,
} from './NativeDeviceInfo';
import {startTransition, useEffect, useSyncExternalStore} from 'react';

const windowDimensionsStore = {
  state: Dimensions.get('window'),
  listeners: new Set(),
  getWindowDimensions: () => {
    return windowDimensionsStore.state;
  },
  setWindowDimensions: (newSize) => {
    if (
      windowDimensionsStore.state.width !== newSize.width ||
      windowDimensionsStore.state.height !== newSize.height ||
      windowDimensionsStore.state.fontScale !== newSize.fontScale ||
      windowDimensionsStore.state.scale !== newSize.scale
    ) {
      windowDimensionsStore.state = newSize;
      for (const listener of windowDimensionsStore.listeners) {
        listener();
      }
    }
  },
  subscribe: (callback) => {
    windowDimensionsStore.listeners.add(callback);
    return () => {
      windowDimensionsStore.listeners.delete(callback);
    };
  },
};

export default function useWindowDimensions():
  | DisplayMetrics
  | DisplayMetricsAndroid {
  const dimensions = useSyncExternalStore(
    windowDimensionsStore.subscribe,
    windowDimensionsStore.getWindowDimensions,
  );
  useEffect(() => {
    function handleChange({
      window,
    }: {
      window: DisplayMetrics | DisplayMetricsAndroid,
    }) {
      if (
        dimensions.width !== window.width ||
        dimensions.height !== window.height ||
        dimensions.scale !== window.scale ||
        dimensions.fontScale !== window.fontScale
      ) {
        // adds smoothness for frequent window resizing
        startTransition(() => {
          windowDimensionsStore.setWindowDimensions(window);
        });
      }
    }
    const subscription = Dimensions.addEventListener('change', handleChange);
    // We might have missed an update between calling `get` in render and
    // `addEventListener` in this handler, so we set it here. If there was
    // no change, React will filter out this update as a no-op.
    handleChange({window: Dimensions.get('window')});
    return () => {
      subscription.remove();
    };
  }, [dimensions]);
  return dimensions;
}

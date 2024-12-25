/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  HostComponent,
  PartialViewConfig,
} from '../../Renderer/shims/ReactNativeTypes';
import type {ScrollViewNativeProps as Props} from './ScrollViewNativeComponentType';

import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';

export const __INTERNAL_VIEW_CONFIG: PartialViewConfig = {
  uiViewClassName: 'AndroidHorizontalScrollView',
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {
    decelerationRate: true,
    disableIntervalMomentum: true,
    maintainVisibleContentPosition: true,
    endFillColor: {process: require('../../StyleSheet/processColor').default},
    fadingEdgeLength: true,
    nestedScrollEnabled: true,
    overScrollMode: true,
    pagingEnabled: true,
    persistentScrollbar: true,
    horizontal: true,
    scrollEnabled: true,
    scrollEventThrottle: true,
    scrollPerfTag: true,
    sendMomentumEvents: true,
    showsHorizontalScrollIndicator: true,
    snapToAlignment: true,
    snapToEnd: true,
    snapToInterval: true,
    snapToStart: true,
    snapToOffsets: true,
    contentOffset: true,
    borderBottomLeftRadius: true,
    borderBottomRightRadius: true,
    borderRadius: true,
    borderStyle: true,
    borderRightColor: {
      process: require('../../StyleSheet/processColor').default,
    },
    borderColor: {process: require('../../StyleSheet/processColor').default},
    borderBottomColor: {
      process: require('../../StyleSheet/processColor').default,
    },
    borderTopLeftRadius: true,
    borderTopColor: {process: require('../../StyleSheet/processColor').default},
    removeClippedSubviews: true,
    borderTopRightRadius: true,
    borderLeftColor: {
      process: require('../../StyleSheet/processColor').default,
    },
    pointerEvents: true,
  },
};

const AndroidHorizontalScrollViewNativeComponent: HostComponent<Props> =
  NativeComponentRegistry.get<Props>(
    'AndroidHorizontalScrollView',
    () => __INTERNAL_VIEW_CONFIG,
  );

export default AndroidHorizontalScrollViewNativeComponent;

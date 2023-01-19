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
import {ConditionallyIgnoredEventHandlers} from '../../NativeComponent/ViewConfigIgnore';
import Platform from '../../Utilities/Platform';

export const __INTERNAL_VIEW_CONFIG: PartialViewConfig =
  Platform.OS === 'android'
    ? {
        uiViewClassName: 'RCTScrollView',
        bubblingEventTypes: {},
        directEventTypes: {
          topMomentumScrollBegin: {
            registrationName: 'onMomentumScrollBegin',
          },
          topMomentumScrollEnd: {
            registrationName: 'onMomentumScrollEnd',
          },
          topScroll: {
            registrationName: 'onScroll',
          },
          topScrollBeginDrag: {
            registrationName: 'onScrollBeginDrag',
          },
          topScrollEndDrag: {
            registrationName: 'onScrollEndDrag',
          },
        },
        validAttributes: {
          contentOffset: {
            diff: require('../../Utilities/differ/pointsDiffer'),
          },
          decelerationRate: true,
          disableIntervalMomentum: true,
          pagingEnabled: true,
          scrollEnabled: true,
          showsVerticalScrollIndicator: true,
          snapToAlignment: true,
          snapToEnd: true,
          snapToInterval: true,
          snapToOffsets: true,
          snapToStart: true,
          borderBottomLeftRadius: true,
          borderBottomRightRadius: true,
          sendMomentumEvents: true,
          borderRadius: true,
          nestedScrollEnabled: true,
          borderStyle: true,
          borderRightColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          borderColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          borderBottomColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          persistentScrollbar: true,
          endFillColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          fadingEdgeLength: true,
          overScrollMode: true,
          borderTopLeftRadius: true,
          scrollPerfTag: true,
          borderTopColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          removeClippedSubviews: true,
          borderTopRightRadius: true,
          borderLeftColor: {
            process: require('../../StyleSheet/processColor').default,
          },
          pointerEvents: true,
        },
      }
    : {
        uiViewClassName: 'RCTScrollView',
        bubblingEventTypes: {},
        directEventTypes: {
          topMomentumScrollBegin: {
            registrationName: 'onMomentumScrollBegin',
          },
          topMomentumScrollEnd: {
            registrationName: 'onMomentumScrollEnd',
          },
          topScroll: {
            registrationName: 'onScroll',
          },
          topScrollBeginDrag: {
            registrationName: 'onScrollBeginDrag',
          },
          topScrollEndDrag: {
            registrationName: 'onScrollEndDrag',
          },
          topScrollToTop: {
            registrationName: 'onScrollToTop',
          },
        },
        validAttributes: {
          alwaysBounceHorizontal: true,
          alwaysBounceVertical: true,
          automaticallyAdjustContentInsets: true,
          automaticallyAdjustKeyboardInsets: true,
          automaticallyAdjustsScrollIndicatorInsets: true,
          bounces: true,
          bouncesZoom: true,
          canCancelContentTouches: true,
          centerContent: true,
          contentInset: {
            diff: require('../../Utilities/differ/insetsDiffer'),
          },
          contentOffset: {
            diff: require('../../Utilities/differ/pointsDiffer'),
          },
          contentInsetAdjustmentBehavior: true,
          decelerationRate: true,
          directionalLockEnabled: true,
          disableIntervalMomentum: true,
          indicatorStyle: true,
          inverted: true,
          keyboardDismissMode: true,
          maintainVisibleContentPosition: true,
          maximumZoomScale: true,
          minimumZoomScale: true,
          pagingEnabled: true,
          pinchGestureEnabled: true,
          scrollEnabled: true,
          scrollEventThrottle: true,
          scrollIndicatorInsets: {
            diff: require('../../Utilities/differ/insetsDiffer'),
          },
          scrollToOverflowEnabled: true,
          scrollsToTop: true,
          showsHorizontalScrollIndicator: true,
          showsVerticalScrollIndicator: true,
          snapToAlignment: true,
          snapToEnd: true,
          snapToInterval: true,
          snapToOffsets: true,
          snapToStart: true,
          zoomScale: true,
          ...ConditionallyIgnoredEventHandlers({
            onScrollBeginDrag: true,
            onMomentumScrollEnd: true,
            onScrollEndDrag: true,
            onMomentumScrollBegin: true,
            onScrollToTop: true,
            onScroll: true,
          }),
        },
      };

const ScrollViewNativeComponent: HostComponent<Props> =
  NativeComponentRegistry.get<Props>(
    'RCTScrollView',
    () => __INTERNAL_VIEW_CONFIG,
  );

export default ScrollViewNativeComponent;

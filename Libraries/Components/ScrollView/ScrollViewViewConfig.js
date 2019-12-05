/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {GeneratedViewConfig} from '../../Utilities/registerGeneratedViewConfig';

const ScrollViewViewConfig = {
  uiViewClassName: 'RCTScrollView',
  bubblingEventTypes: {},
  directEventTypes: {
    topScrollToTop: {
      registrationName: 'onScrollToTop',
    },
  },
  validAttributes: {
    alwaysBounceHorizontal: true,
    alwaysBounceVertical: true,
    automaticallyAdjustContentInsets: true,
    bounces: true,
    bouncesZoom: true,
    canCancelContentTouches: true,
    centerContent: true,
    contentInset: {diff: require('../../Utilities/differ/pointsDiffer')},
    contentOffset: {diff: require('../../Utilities/differ/pointsDiffer')},
    contentInsetAdjustmentBehavior: true,
    decelerationRate: true,
    directionalLockEnabled: true,
    disableIntervalMomentum: true,
    endFillColor: {process: require('../../StyleSheet/processColor')},
    fadingEdgeLength: true,
    indicatorStyle: true,
    keyboardDismissMode: true,
    maintainVisibleContentPosition: true,
    maximumZoomScale: true,
    minimumZoomScale: true,
    nestedScrollEnabled: true,
    onMomentumScrollBegin: true,
    onMomentumScrollEnd: true,
    onScroll: true,
    onScrollBeginDrag: true,
    onScrollEndDrag: true,
    onScrollToTop: true,
    overScrollMode: true,
    pagingEnabled: true,
    persistentScrollbar: true,
    pinchGestureEnabled: true,
    scrollEnabled: true,
    scrollEventThrottle: true,
    scrollIndicatorInsets: {
      diff: require('../../Utilities/differ/pointsDiffer'),
    },
    scrollPerfTag: true,
    scrollToOverflowEnabled: true,
    scrollsToTop: true,
    sendMomentumEvents: true,
    showsHorizontalScrollIndicator: true,
    showsVerticalScrollIndicator: true,
    snapToAlignment: true,
    snapToEnd: true,
    snapToInterval: true,
    snapToOffsets: true,
    snapToStart: true,
    zoomScale: true,

    DEPRECATED_sendUpdatedChildFrames: true,
  },
};

module.exports = (ScrollViewViewConfig: GeneratedViewConfig);

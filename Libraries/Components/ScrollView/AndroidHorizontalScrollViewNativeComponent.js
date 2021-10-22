/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ScrollViewNativeProps as Props} from './ScrollViewNativeComponentType';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';

const AndroidHorizontalScrollViewNativeComponent: HostComponent<Props> = NativeComponentRegistry.get<Props>(
  'AndroidHorizontalScrollView',
  () => ({
    uiViewClassName: 'AndroidHorizontalScrollView',
    bubblingEventTypes: {},
    directEventTypes: {},
    validAttributes: {
      decelerationRate: true,
      disableIntervalMomentum: true,
      endFillColor: {process: require('../../StyleSheet/processColor')},
      fadingEdgeLength: true,
      nestedScrollEnabled: true,
      overScrollMode: true,
      pagingEnabled: true,
      persistentScrollbar: true,
      scrollEnabled: true,
      scrollPerfTag: true,
      sendMomentumEvents: true,
      showsHorizontalScrollIndicator: true,
      snapToAlignment: true,
      snapToEnd: true,
      snapToInterval: true,
      snapToStart: true,
      snapToOffsets: true,
      contentOffset: true,
    },
  }),
);

export default AndroidHorizontalScrollViewNativeComponent;

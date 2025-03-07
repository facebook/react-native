/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {HostComponent} from '../../../src/private/types/HostComponent';
import type {PartialViewConfig} from '../../Renderer/shims/ReactNativeTypes';
import type {ViewProps as Props} from '../View/ViewPropTypes';

import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';

export const __INTERNAL_VIEW_CONFIG: PartialViewConfig = {
  uiViewClassName: 'RCTScrollContentView',
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {},
};

const ScrollContentViewNativeComponent: HostComponent<Props> =
  NativeComponentRegistry.get<Props>(
    'RCTScrollContentView',
    () => __INTERNAL_VIEW_CONFIG,
  );

export default ScrollContentViewNativeComponent;

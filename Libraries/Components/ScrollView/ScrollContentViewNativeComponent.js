/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';
import type {ViewProps as Props} from '../View/ViewPropTypes';

const ScrollContentViewNativeComponent: HostComponent<Props> = NativeComponentRegistry.get<Props>(
  'RCTScrollContentView',
  () => ({
    uiViewClassName: 'RCTScrollContentView',
    bubblingEventTypes: {},
    directEventTypes: {},
    validAttributes: {},
  }),
);

export default ScrollContentViewNativeComponent;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import registerGeneratedViewConfig from '../../Utilities/registerGeneratedViewConfig';
import requireNativeComponent from '../../ReactNative/requireNativeComponent';

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {ViewProps} from '../View/ViewPropTypes';

const ScrollContentViewViewConfig = {
  uiViewClassName: 'RCTScrollContentView',
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {},
};

let ScrollContentViewNativeComponent;
if (global.RN$Bridgeless) {
  registerGeneratedViewConfig(
    'RCTScrollContentView',
    ScrollContentViewViewConfig,
  );
  ScrollContentViewNativeComponent = 'RCTScrollContentView';
} else {
  ScrollContentViewNativeComponent = requireNativeComponent<ViewProps>(
    'RCTScrollContentView',
  );
}

export default ((ScrollContentViewNativeComponent: any): HostComponent<ViewProps>);

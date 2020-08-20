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

const AndroidHorizontalScrollContentViewViewConfig = {
  uiViewClassName: 'AndroidHorizontalScrollContentView',
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {},
};

let AndroidHorizontalScrollContentViewNativeComponent;
if (global.RN$Bridgeless) {
  registerGeneratedViewConfig(
    'AndroidHorizontalScrollContentView',
    AndroidHorizontalScrollContentViewViewConfig,
  );
  AndroidHorizontalScrollContentViewNativeComponent =
    'AndroidHorizontalScrollContentView';
} else {
  AndroidHorizontalScrollContentViewNativeComponent = requireNativeComponent<ViewProps>(
    'AndroidHorizontalScrollContentView',
  );
}

export default ((AndroidHorizontalScrollContentViewNativeComponent: any): HostComponent<ViewProps>);

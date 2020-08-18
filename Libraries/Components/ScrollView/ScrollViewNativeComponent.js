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

const registerGeneratedViewConfig = require('../../Utilities/registerGeneratedViewConfig');
const requireNativeComponent = require('../../ReactNative/requireNativeComponent');
import ScrollViewViewConfig from './ScrollViewViewConfig';

import type {
  ScrollViewNativeProps,
  ScrollViewNativeComponentType,
} from './ScrollViewNativeComponentType';

let ScrollViewNativeComponent;
if (global.RN$Bridgeless) {
  registerGeneratedViewConfig('RCTScrollView', ScrollViewViewConfig);
  ScrollViewNativeComponent = 'RCTScrollView';
} else {
  ScrollViewNativeComponent = requireNativeComponent<ScrollViewNativeProps>(
    'RCTScrollView',
  );
}

export default ((ScrollViewNativeComponent: any): ScrollViewNativeComponentType);

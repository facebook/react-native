/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Platform from '../../Utilities/Platform';
import * as React from 'react';
import View from '../View/View';

import type {ViewProps} from '../View/ViewPropTypes';

let exported: React.AbstractComponent<ViewProps, React.ElementRef<typeof View>>;

/**
 * Renders nested content and automatically applies paddings reflect the portion
 * of the view that is not covered by navigation bars, tab bars, toolbars, and
 * other ancestor views.
 *
 * Moreover, and most importantly, Safe Area's paddings reflect physical
 * limitation of the screen, such as rounded corners or camera notches (aka
 * sensor housing area on iPhone X).
 */
if (Platform.OS === 'android') {
  exported = View;
} else {
  exported = require('./RCTSafeAreaViewNativeComponent').default;
}

export default exported;

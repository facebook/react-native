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

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {ViewProps} from '../View/ViewPropTypes';

let exported: React.AbstractComponent<
  ViewProps,
  React.ElementRef<HostComponent<mixed>>,
>;

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
  exported = React.forwardRef<
    ViewProps,
    React.ElementRef<HostComponent<mixed>>,
  >(function SafeAreaView(props, forwardedRef) {
    return <View {...props} ref={forwardedRef} />;
  });
} else {
  const RCTSafeAreaViewNativeComponent =
    require('./RCTSafeAreaViewNativeComponent').default;

  exported = React.forwardRef<
    ViewProps,
    React.ElementRef<HostComponent<mixed>>,
  >(function SafeAreaView(props, forwardedRef) {
    return <RCTSafeAreaViewNativeComponent {...props} ref={forwardedRef} />;
  });
}

export default exported;

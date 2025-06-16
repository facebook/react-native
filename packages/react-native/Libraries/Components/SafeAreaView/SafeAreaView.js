/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../View/ViewPropTypes';

import Platform from '../../Utilities/Platform';
import View from '../View/View';
import * as React from 'react';
import {useEffect} from 'react';

/**
 * @deprecated
 * Use `react-native-safe-area-context` instead. This component is deprecated and will be removed in a future release.
 *
 * Renders nested content and automatically applies paddings reflect the portion
 * of the view that is not covered by navigation bars, tab bars, toolbars, and
 * other ancestor views.
 *
 * Moreover, and most importantly, Safe Area's paddings reflect physical
 * limitation of the screen, such as rounded corners or camera notches (aka
 * sensor housing area on iPhone X).
 */
const SafeAreaView = React.forwardRef(function SafeAreaView(props, ref) {
  useEffect(() => {
    if (__DEV__) {
      console.warn(
        'SafeAreaView is deprecated and will be removed in a future release. ' +
        'Please use `react-native-safe-area-context` instead.'
      );
    }
  }, []);

  const Component = Platform.select({
    ios: require('./RCTSafeAreaViewNativeComponent').default,
    default: View,
  });

  return <Component ref={ref} {...props} />;
});

export default SafeAreaView;

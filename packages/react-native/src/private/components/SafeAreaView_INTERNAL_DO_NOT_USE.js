/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {ViewProps} from '../../../Libraries/Components/View/ViewPropTypes';
import Platform from '../../../Libraries/Utilities/Platform';
import View from '../../../Libraries/Components/View/View';
import * as React from 'react';
export * from '../../../src/private/specs/components/RCTSafeAreaViewNativeComponent';
import RCTSafeAreaViewNativeComponent from '../../../src/private/specs/components/RCTSafeAreaViewNativeComponent';

let exported: React.AbstractComponent<ViewProps, React.ElementRef<typeof View>>;

if (Platform.OS === 'android' || Platform.OS === 'ios') {
  exported = RCTSafeAreaViewNativeComponent;
} else {
  exported = View;
}

export default exported;

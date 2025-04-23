/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {HostComponent} from 'react-native';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import type {
  BubblingEventHandler,
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type OnChangeEvent = $ReadOnly<{
  location: {
    source: {url: string, ...},
    x: Int32,
    y: Int32,
    arrayOfObjects: $ReadOnlyArray<{value: $ReadOnly<{str: string}>}>,
    ...
  },
}>;

type NativeProps = $ReadOnly<{
  ...ViewProps,

  // Props
  disabled?: WithDefault<boolean, false>,

  // Events
  onChange?: ?BubblingEventHandler<OnChangeEvent>,
}>;

export default (codegenNativeComponent<NativeProps>(
  'EventNestedObjectPropsNativeComponentView',
): HostComponent<NativeProps>);

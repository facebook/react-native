/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';

import {codegenNativeComponent} from 'react-native';

type OnChangeEvent = $ReadOnly<{
  location: {
    source: {url: string, ...},
    x: CodegenTypes.Int32,
    y: CodegenTypes.Int32,
    arrayOfObjects: $ReadOnlyArray<{value: $ReadOnly<{str: string}>}>,
    ...
  },
}>;

type NativeProps = $ReadOnly<{
  ...ViewProps,

  // Props
  disabled?: CodegenTypes.WithDefault<boolean, false>,

  // Events
  onChange?: ?CodegenTypes.BubblingEventHandler<OnChangeEvent>,
}>;

export default (codegenNativeComponent<NativeProps>(
  'EventNestedObjectPropsNativeComponentView',
): HostComponent<NativeProps>);

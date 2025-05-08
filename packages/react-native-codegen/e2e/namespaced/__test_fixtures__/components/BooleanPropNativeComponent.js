/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';

import {codegenNativeComponent} from 'react-native';

type NativeProps = $ReadOnly<{
  ...ViewProps,

  // Props
  disabled?: CodegenTypes.WithDefault<boolean, false>,
  disabledNullable?: CodegenTypes.WithDefault<boolean, null>,
}>;

export default (codegenNativeComponent<NativeProps>(
  'BooleanPropNativeComponentView',
): HostComponent<NativeProps>);

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {HostComponent, ViewProps} from 'react-native';

import {codegenNativeComponent} from 'react-native';

type NativeProps = $ReadOnly<{
  ...ViewProps,

  // Props
  // TODO(T104760003) Fix EdgeInsetsValue in codegen
  // contentInset?: EdgeInsetsValue,
}>;

export default (codegenNativeComponent<NativeProps>(
  'EdgeInsetsPropNativeComponentView',
): HostComponent<NativeProps>);

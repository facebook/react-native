/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
import type {HostComponent} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import type {Float} from 'react-native/Libraries/Types/CodegenTypes';
import * as React from 'react';

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  opacity?: Float,
|}>;

export type MyNativeViewType = HostComponent<NativeProps>;

interface NativeCommands {
  +callNativeMethodToChangeBackgroundColor: (
    viewRef: React.ElementRef<MyNativeViewType>,
    color: string,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['callNativeMethodToChangeBackgroundColor'],
});

export default (codegenNativeComponent<NativeProps>(
  'RNTMyNativeView',
): MyNativeViewType);

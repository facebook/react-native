/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type {HostComponent} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';
import type {UnsafeMixed} from 'react-native/Libraries/Types/CodegenTypes';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  mixedProp?: UnsafeMixed,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'MixedPropNativeComponentView',
): HostComponent<NativeProps>);

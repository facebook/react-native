/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ViewProps} from '../View/ViewPropTypes';
import type {WithDefault} from '../../Types/CodegenTypes';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  emulateUnlessSupported?: WithDefault<boolean, false>,
|}>;

export default (codegenNativeComponent<NativeProps>('SafeAreaView', {
  paperComponentName: 'RCTSafeAreaView',
  interfaceOnly: true,
}): HostComponent<NativeProps>);

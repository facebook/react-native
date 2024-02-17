/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ViewProps} from '../../../../Libraries/Components/View/ViewPropTypes';
import type {HostComponent} from '../../../../Libraries/Renderer/shims/ReactNativeTypes';

import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // No props
|}>;

export default (codegenNativeComponent<NativeProps>('SafeAreaView', {
  paperComponentName: 'RCTSafeAreaView',
  interfaceOnly: true,
}): HostComponent<NativeProps>);

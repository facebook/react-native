/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../../../../Libraries/Components/View/ViewPropTypes';
import type {HostComponent} from '../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {ColorValue} from '../../../../Libraries/StyleSheet/StyleSheet';
import type {
  Double,
  WithDefault,
} from '../../../../Libraries/Types/CodegenTypes';

import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';

type NativeProps = $ReadOnly<{
  ...ViewProps,

  //Props
  styleAttr?: string,
  typeAttr?: string,
  indeterminate: boolean,
  progress?: WithDefault<Double, 0>,
  animating?: WithDefault<boolean, true>,
  color?: ?ColorValue,
  testID?: WithDefault<string, ''>,
}>;

export default (codegenNativeComponent<NativeProps>('AndroidProgressBar', {
  interfaceOnly: true,
}): HostComponent<NativeProps>);

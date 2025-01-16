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
import type {ImageSource} from 'react-native/Libraries/Image/ImageSource';
import type {HostComponent} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type NativeProps = $ReadOnly<{
  ...ViewProps,

  // Props
  thumbImage?: ImageSource,
}>;

export default (codegenNativeComponent<NativeProps>(
  'ImagePropNativeComponentView',
): HostComponent<NativeProps>);

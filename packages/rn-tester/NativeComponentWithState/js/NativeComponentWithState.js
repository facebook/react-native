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

import type {ImageSource} from 'react-native/Libraries/Image/ImageSource';
import type {HostComponent} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  imageSource: ImageSource,
|}>;

// The NativeState is not used in JS-land, so we don't have to export it.
// eslint-disable-next-line no-unused-vars
type ComponentNativeState = $ReadOnly<{|
  imageSource: ImageSource,
  //$FlowFixMe[cannot-resolve-name]: this type is not exposed in JS but we can use it in the Native State.
  imageRequest: ImageRequest,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'RNTNativeComponentWithState',
): HostComponent<NativeProps>);

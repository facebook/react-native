/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const requireNativeComponent = require('../ReactNative/requireNativeComponent');

import type {DangerouslyImpreciseStyle} from '../StyleSheet/StyleSheet';
import type {ResolvedAssetSource} from './AssetSourceResolver';
import type {HostComponent} from '../Renderer/shims/ReactNativeTypes';
import type {ImageProps} from './ImageProps';
import type {ViewProps} from '../Components/View/ViewPropTypes';
import type {ImageStyleProp} from '../StyleSheet/StyleSheet';
import type {ColorValue} from '../StyleSheet/StyleSheet';

import ImageViewViewConfig from './ImageViewViewConfig';
const ReactNativeViewConfigRegistry = require('../Renderer/shims/ReactNativeViewConfigRegistry');

type NativeProps = $ReadOnly<{|
  ...ImageProps,
  ...ViewProps,

  style?: ImageStyleProp | DangerouslyImpreciseStyle,

  // iOS native props
  tintColor?: ColorValue,

  // Android native props
  shouldNotifyLoadEvents?: boolean,
  src?: ?ResolvedAssetSource | $ReadOnlyArray<{uri: string, ...}>,
  headers?: ?string,
  defaultSrc?: ?string,
  loadingIndicatorSrc?: ?string,
|}>;

let ImageViewNativeComponent;
if (global.RN$Bridgeless) {
  ReactNativeViewConfigRegistry.register('RCTImageView', () => {
    return ImageViewViewConfig;
  });
  ImageViewNativeComponent = 'RCTImageView';
} else {
  ImageViewNativeComponent = requireNativeComponent<NativeProps>(
    'RCTImageView',
  );
}

// flowlint-next-line unclear-type:off
export default ((ImageViewNativeComponent: any): HostComponent<NativeProps>);

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ResolvedAssetSource} from './AssetSourceResolver';
import type {ImageProps} from './ImageProps';
import type {ViewProps} from '../Components/View/ViewPropTypes';
import * as NativeComponentRegistry from '../NativeComponent/NativeComponentRegistry';
import type {HostComponent} from '../Renderer/shims/ReactNativeTypes';
import type {
  ColorValue,
  DangerouslyImpreciseStyle,
  ImageStyleProp,
} from '../StyleSheet/StyleSheet';
import Platform from '../Utilities/Platform';

type Props = $ReadOnly<{
  ...ImageProps,
  ...ViewProps,

  style?: ImageStyleProp | DangerouslyImpreciseStyle,

  // iOS native props
  tintColor?: ColorValue,

  // Android native props
  shouldNotifyLoadEvents?: boolean,
  src?: ?ResolvedAssetSource | $ReadOnlyArray<{uri: string, ...}>,
  headers?: ?{[string]: string},
  defaultSrc?: ?string,
  loadingIndicatorSrc?: ?string,
}>;

const ImageViewViewConfig =
  Platform.OS === 'android'
    ? {
        uiViewClassName: 'RCTImageView',
        bubblingEventTypes: {},
        directEventTypes: {
          topLoadStart: {
            registrationName: 'onLoadStart',
          },
          topProgress: {
            registrationName: 'onProgress',
          },
          topError: {
            registrationName: 'onError',
          },
          topLoad: {
            registrationName: 'onLoad',
          },
          topLoadEnd: {
            registrationName: 'onLoadEnd',
          },
        },
        validAttributes: {
          blurRadius: true,
          internal_analyticTag: true,
          resizeMode: true,
          tintColor: {
            process: require('../StyleSheet/processColor'),
          },
          borderBottomLeftRadius: true,
          borderTopLeftRadius: true,
          resizeMethod: true,
          src: true,
          borderRadius: true,
          headers: true,
          shouldNotifyLoadEvents: true,
          defaultSrc: true,
          overlayColor: {
            process: require('../StyleSheet/processColor'),
          },
          borderColor: {
            process: require('../StyleSheet/processColor'),
          },
          accessible: true,
          progressiveRenderingEnabled: true,
          fadeDuration: true,
          borderBottomRightRadius: true,
          borderTopRightRadius: true,
          loadingIndicatorSrc: true,
        },
      }
    : {
        uiViewClassName: 'RCTImageView',
        bubblingEventTypes: {},
        directEventTypes: {
          topLoadStart: {
            registrationName: 'onLoadStart',
          },
          topProgress: {
            registrationName: 'onProgress',
          },
          topError: {
            registrationName: 'onError',
          },
          topPartialLoad: {
            registrationName: 'onPartialLoad',
          },
          topLoad: {
            registrationName: 'onLoad',
          },
          topLoadEnd: {
            registrationName: 'onLoadEnd',
          },
        },
        validAttributes: {
          blurRadius: true,
          capInsets: {
            diff: require('../Utilities/differ/insetsDiffer'),
          },
          defaultSource: {
            process: require('./resolveAssetSource'),
          },
          internal_analyticTag: true,
          resizeMode: true,
          source: true,
          tintColor: {
            process: require('../StyleSheet/processColor'),
          },
        },
      };

const ImageViewNativeComponent: HostComponent<Props> =
  NativeComponentRegistry.get<Props>('RCTImageView', () => ImageViewViewConfig);

export default ImageViewNativeComponent;

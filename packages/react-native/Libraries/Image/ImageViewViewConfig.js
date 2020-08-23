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

import ReactNativeViewViewConfig from '../Components/View/ReactNativeViewViewConfig';
import type {ReactNativeBaseComponentViewConfig} from '../Renderer/shims/ReactNativeTypes';

const ImageViewViewConfig = {
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
    ...ReactNativeViewViewConfig.validAttributes,
    blurRadius: true,
    // flowlint-next-line unclear-type:off
    capInsets: {diff: (require('../Utilities/differ/insetsDiffer'): any)},
    defaultSource: {
      process: require('./resolveAssetSource'),
    },
    defaultSrc: true,
    fadeDuration: true,
    headers: true,
    loadingIndicatorSrc: true,
    onError: true,
    onLoad: true,
    onLoadEnd: true,
    onLoadStart: true,
    onPartialLoad: true,
    onProgress: true,
    overlayColor: {process: require('../StyleSheet/processColor')},
    progressiveRenderingEnabled: true,
    resizeMethod: true,
    resizeMode: true,
    shouldNotifyLoadEvents: true,
    source: true,
    src: true,
    tintColor: {process: require('../StyleSheet/processColor')},
  },
};

module.exports = (ImageViewViewConfig: ReactNativeBaseComponentViewConfig<>);

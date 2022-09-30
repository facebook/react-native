/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from '../Components/View/ViewPropTypes';
import type {
  HostComponent,
  PartialViewConfig,
} from '../Renderer/shims/ReactNativeTypes';
import type {ColorValue} from '../StyleSheet/StyleSheet';
import type {ImageResizeMode} from './ImageResizeMode';

import * as NativeComponentRegistry from '../NativeComponent/NativeComponentRegistry';

type NativeProps = $ReadOnly<{
  ...ViewProps,
  resizeMode?: ?ImageResizeMode,
  src?: ?$ReadOnlyArray<?$ReadOnly<{uri?: ?string, ...}>>,
  tintColor?: ?ColorValue,
  headers?: ?{[string]: string},
}>;

export const __INTERNAL_VIEW_CONFIG: PartialViewConfig = {
  uiViewClassName: 'RCTTextInlineImage',
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {
    resizeMode: true,
    src: true,
    tintColor: {
      process: require('../StyleSheet/processColor'),
    },
    headers: true,
  },
};

const TextInlineImage: HostComponent<NativeProps> =
  NativeComponentRegistry.get<NativeProps>(
    'RCTTextInlineImage',
    () => __INTERNAL_VIEW_CONFIG,
  );

export default TextInlineImage;

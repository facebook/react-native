/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {HostComponent} from '../../src/private/types/HostComponent';
import type {ViewProps} from '../Components/View/ViewPropTypes';
import type {PartialViewConfig} from '../Renderer/shims/ReactNativeTypes';
import type {ColorValue} from '../StyleSheet/StyleSheet';
import type {ImageResizeMode} from './ImageResizeMode';

import * as NativeComponentRegistry from '../NativeComponent/NativeComponentRegistry';

type RCTTextInlineImageNativeProps = $ReadOnly<{
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
      process: require('../StyleSheet/processColor').default,
    },
    headers: true,
  },
};

const TextInlineImage: HostComponent<RCTTextInlineImageNativeProps> =
  NativeComponentRegistry.get<RCTTextInlineImageNativeProps>(
    'RCTTextInlineImage',
    () => __INTERNAL_VIEW_CONFIG,
  );

export default TextInlineImage;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {PartialViewConfig} from '../Renderer/shims/ReactNativeTypes';

import BaseViewConfig from './BaseViewConfig';

export type PartialViewConfigWithoutName = $Rest<
  PartialViewConfig,
  {uiViewClassName: string},
>;

const PlatformBaseViewConfig: PartialViewConfigWithoutName = BaseViewConfig;

// In Wilde/FB4A, use RNHostComponentListRoute in Bridge mode to verify
// whether the JS props defined here match the native props defined
// in RCTViewManagers in iOS, and ViewManagers in Android.
export default PlatformBaseViewConfig;

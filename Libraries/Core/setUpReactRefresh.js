/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

if (__DEV__) {
  const NativeDevSettings = require('../NativeModules/specs/NativeDevSettings')
    .default;

  if (typeof NativeDevSettings.reload !== 'function') {
    throw new Error('Could not find the reload() implementation.');
  }

  if ((module: any).hot) {
    // This needs to run before the renderer initializes.
    const ReactRefreshRuntime = require('react-refresh/runtime');
    ReactRefreshRuntime.injectIntoGlobalHook(global);

    (require: any).Refresh = {
      // Full Refresh
      performFullRefresh() {
        NativeDevSettings.reload();
      },
      // React Refresh
      createSignatureFunctionForTransform:
        ReactRefreshRuntime.createSignatureFunctionForTransform,
      isLikelyComponentType: ReactRefreshRuntime.isLikelyComponentType,
      register: ReactRefreshRuntime.register,
      performReactRefresh: ReactRefreshRuntime.performReactRefresh,
    };
  }
}

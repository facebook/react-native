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

  // This needs to run before the renderer initializes.
  const ReactRefreshRuntime = require('react-refresh/runtime');
  ReactRefreshRuntime.injectIntoGlobalHook(global);

  const Refresh = {
    performFullRefresh() {
      NativeDevSettings.reload();
    },

    createSignatureFunctionForTransform:
      ReactRefreshRuntime.createSignatureFunctionForTransform,

    isLikelyComponentType: ReactRefreshRuntime.isLikelyComponentType,

    getFamilyByType: ReactRefreshRuntime.getFamilyByType,

    register: ReactRefreshRuntime.register,

    performReactRefresh() {
      if (ReactRefreshRuntime.hasUnrecoverableErrors()) {
        NativeDevSettings.reload();
        return;
      }
      ReactRefreshRuntime.performReactRefresh();
    },
  };

  (require: any).Refresh = Refresh;
}

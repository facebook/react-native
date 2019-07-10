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
    // This can be set from the app as a workaround
    // if you really want a full reload on every change:
    // if (__DEV__) require.Refresh.forceFullRefresh = true;
    forceFullRefresh: false,

    performFullRefresh() {
      NativeDevSettings.reload();
    },

    createSignatureFunctionForTransform:
      ReactRefreshRuntime.createSignatureFunctionForTransform,

    isLikelyComponentType: ReactRefreshRuntime.isLikelyComponentType,

    getFamilyByType: ReactRefreshRuntime.getFamilyByType,

    register: ReactRefreshRuntime.register,

    performReactRefresh() {
      if (Refresh.forceFullRefresh) {
        NativeDevSettings.reload();
      } else {
        ReactRefreshRuntime.performReactRefresh();
      }
    },
  };

  (require: any).Refresh = Refresh;
}

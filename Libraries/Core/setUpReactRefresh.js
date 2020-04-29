/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
<<<<<<< HEAD
'use strict';

if (__DEV__) {
  const NativeDevSettings = require('../NativeModules/specs/NativeDevSettings')
    .default;

  if (typeof NativeDevSettings.reload !== 'function') {
=======

'use strict';

if (__DEV__) {
  const DevSettings = require('../Utilities/DevSettings');

  if (typeof DevSettings.reload !== 'function') {
>>>>>>> fb/0.62-stable
    throw new Error('Could not find the reload() implementation.');
  }

  // This needs to run before the renderer initializes.
  const ReactRefreshRuntime = require('react-refresh/runtime');
  ReactRefreshRuntime.injectIntoGlobalHook(global);

  const Refresh = {
<<<<<<< HEAD
    performFullRefresh() {
      NativeDevSettings.reload();
=======
    performFullRefresh(reason: string) {
      DevSettings.reload(reason);
>>>>>>> fb/0.62-stable
    },

    createSignatureFunctionForTransform:
      ReactRefreshRuntime.createSignatureFunctionForTransform,

    isLikelyComponentType: ReactRefreshRuntime.isLikelyComponentType,

    getFamilyByType: ReactRefreshRuntime.getFamilyByType,

    register: ReactRefreshRuntime.register,

    performReactRefresh() {
      if (ReactRefreshRuntime.hasUnrecoverableErrors()) {
<<<<<<< HEAD
        NativeDevSettings.reload();
        return;
      }
      ReactRefreshRuntime.performReactRefresh();
=======
        DevSettings.reload('Fast Refresh - Unrecoverable');
        return;
      }
      ReactRefreshRuntime.performReactRefresh();
      DevSettings.onFastRefresh();
>>>>>>> fb/0.62-stable
    },
  };

  (require: any).Refresh = Refresh;
}

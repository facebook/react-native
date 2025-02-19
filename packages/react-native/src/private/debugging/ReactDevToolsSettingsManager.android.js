/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import NativeReactDevToolsSettingsManager from '../specs_DEPRECATED/modules/NativeReactDevToolsSettingsManager';

module.exports = {
  setGlobalHookSettings(settings: string) {
    NativeReactDevToolsSettingsManager?.setGlobalHookSettings(settings);
  },
  getGlobalHookSettings(): ?string {
    return NativeReactDevToolsSettingsManager?.getGlobalHookSettings();
  },
};

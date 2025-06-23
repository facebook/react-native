/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import DevSettings from '../Utilities/DevSettings';
import NativeDevToolsSettingsManager from './NativeDevToolsSettingsManager';

module.exports = {
  setConsolePatchSettings(newSettings: string) {
    NativeDevToolsSettingsManager?.setConsolePatchSettings(newSettings);
  },
  getConsolePatchSettings(): ?string {
    return NativeDevToolsSettingsManager?.getConsolePatchSettings();
  },
  setProfilingSettings(newSettings: string) {
    if (NativeDevToolsSettingsManager?.setProfilingSettings != null) {
      NativeDevToolsSettingsManager.setProfilingSettings(newSettings);
    }
  },
  getProfilingSettings(): ?string {
    if (NativeDevToolsSettingsManager?.getProfilingSettings != null) {
      return NativeDevToolsSettingsManager.getProfilingSettings();
    }
    return null;
  },
  reload(): void {
    DevSettings?.reload();
  },
};

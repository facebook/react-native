/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Settings from '../Settings/Settings';
import DevSettings from '../Utilities/DevSettings';

const CONSOLE_PATCH_SETTINGS_KEY = 'ReactDevTools::ConsolePatchSettings';
const PROFILING_SETTINGS_KEY = 'ReactDevTools::ProfilingSettings';

const DevToolsSettingsManager = {
  setConsolePatchSettings(newConsolePatchSettings: string): void {
    Settings.set({
      [CONSOLE_PATCH_SETTINGS_KEY]: newConsolePatchSettings,
    });
  },
  getConsolePatchSettings(): ?string {
    const value = Settings.get(CONSOLE_PATCH_SETTINGS_KEY);
    if (typeof value === 'string') {
      return value;
    }
    return null;
  },

  setProfilingSettings(newProfilingSettings: string): void {
    Settings.set({
      [PROFILING_SETTINGS_KEY]: newProfilingSettings,
    });
  },
  getProfilingSettings(): ?string {
    const value = Settings.get(PROFILING_SETTINGS_KEY);
    if (typeof value === 'string') {
      return value;
    }
    return null;
  },

  reload(): void {
    DevSettings?.reload();
  },
};

module.exports = DevToolsSettingsManager;

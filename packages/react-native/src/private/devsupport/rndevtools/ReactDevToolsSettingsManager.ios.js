/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Settings from '../../../../Libraries/Settings/Settings';

const GLOBAL_HOOK_SETTINGS = 'ReactDevTools::HookSettings';

const ReactDevToolsSettingsManager = {
  setGlobalHookSettings(settings: string): void {
    Settings.set({
      [GLOBAL_HOOK_SETTINGS]: settings,
    });
  },
  getGlobalHookSettings(): ?string {
    const value = Settings.get(GLOBAL_HOOK_SETTINGS);
    if (typeof value === 'string') {
      return value;
    }
    return null;
  },
};

module.exports = ReactDevToolsSettingsManager;

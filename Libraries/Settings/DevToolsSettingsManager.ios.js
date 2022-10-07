/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {Spec} from './NativeDevToolsSettingsManager';
import Settings from './Settings';

const CONSOLE_PATCH_SETTINGS_KEY = 'ReactDevTools::ConsolePatchSettings';

const DevToolsSettingsManager = {
  setConsolePatchSettings: (newConsolePatchSettings: string) => {
    Settings.set({
      [CONSOLE_PATCH_SETTINGS_KEY]: newConsolePatchSettings,
    });
  },
  getConsolePatchSettings: () =>
    ((Settings.get(CONSOLE_PATCH_SETTINGS_KEY): any): string),
};

module.exports = (DevToolsSettingsManager: Spec);

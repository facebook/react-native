/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import NativeReactDevToolsSettingsManager from './specs/NativeReactDevToolsSettingsManager';

export function setGlobalHookSettings(settings: string) {
  NativeReactDevToolsSettingsManager?.setGlobalHookSettings(settings);
}

export function getGlobalHookSettings(): ?string {
  return NativeReactDevToolsSettingsManager?.getGlobalHookSettings();
}

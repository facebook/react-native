/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export interface DevToolsSettingsManagerStatic {
  reload(): void;
  setConsolePatchSettings(newSettings: string): void;
  getConsolePatchSettings(): string | null;
  setProfilingSettings(newSettings: string): void;
  getProfilingSettings(): string | null;
}

export const DevToolsSettingsManager: DevToolsSettingsManagerStatic;
export type DevToolsSettingsManager = DevToolsSettingsManagerStatic;

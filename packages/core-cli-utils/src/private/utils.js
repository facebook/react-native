/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {Task} from './types';

import execa from 'execa';
import os from 'os';

export function task(label: string, action: Task['action']): Task {
  return {
    action,
    label,
  };
}

export const isWindows = os.platform() === 'win32';
export const isMacOS = os.platform() === 'darwin';

export const toPascalCase = (label: string): string =>
  label.length === 0 ? '' : label[0].toUpperCase() + label.slice(1);

type PathCheckResult = {
  found: boolean,
  dep: string,
  description: string,
};

export function isOnPath(dep: string, description: string): PathCheckResult {
  const result = execa.sync(isWindows ? 'where' : 'which', [dep]);
  return {
    dep,
    description,
    found: result.exitCode === 0,
  };
}

export function assertDependencies(
  ...deps: $ReadOnlyArray<ReturnType<typeof isOnPath>>
) {
  for (const {found, dep, description} of deps) {
    if (!found) {
      throw new Error(`"${dep}" not found, ${description}`);
    }
  }
}

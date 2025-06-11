/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Task} from './types';

import execa from 'execa';
import os from 'os';

export function task<R>(
  order: number,
  label: string,
  action: Task<R>['action'],
): Task<R> {
  return {
    action,
    label,
    order,
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
  const cmd = isWindows ? ['where', [dep]] : ['command', ['-v', dep]];
  try {
    return {
      dep,
      description,
      found: execa.sync(...cmd).exitCode === 0,
    };
  } catch {
    return {
      dep,
      description,
      found: false,
    };
  }
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

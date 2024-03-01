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

import os from 'os';

export function task(label: string, action: Task['action']): Task {
  return {
    label,
    action,
  };
}

export const isWindows = os.platform() === 'win32';
export const isMacOS = os.platform() === 'darwin';

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  AppLauncher,
  DebuggerShellPreparationResult,
} from '../../types/AppLauncher';

/**
 * Mock implementation of DefaultAppLauncher to prevent actual browser
 * and debugger-shell launches during tests.
 */
const DefaultAppLauncher: AppLauncher = {
  launchDebuggerAppWindow: jest
    .fn<[string], Promise<void>>()
    .mockResolvedValue(),
  launchDebuggerShell: jest
    .fn<[string, string], Promise<void>>()
    .mockResolvedValue(),
  prepareDebuggerShell: jest
    .fn<[], Promise<DebuggerShellPreparationResult>>()
    .mockResolvedValue({code: 'success'}),
};

export default DefaultAppLauncher;

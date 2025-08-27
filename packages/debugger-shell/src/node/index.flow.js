/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {
  prepareDebuggerShellFromDotSlashFile,
  spawnAndGetStderr,
} from './private/LaunchUtils';

const {spawn} = require('cross-spawn');
const path = require('path');

// The 'prebuilt' flavor will use the prebuilt shell binary (and the JavaScript embedded in it).
// The 'dev' flavor will use a stock Electron binary and run the shell code from the `electron/` directory.
type DebuggerShellFlavor = 'prebuilt' | 'dev';

const DEVTOOLS_BINARY_DOTSLASH_FILE = path.join(
  __dirname,
  '../../bin/react-native-devtools',
);

async function unstable_spawnDebuggerShellWithArgs(
  args: string[],
  {
    mode = 'detached',
    flavor = 'prebuilt',
  }: $ReadOnly<{
    // In 'syncAndExit' mode, the current process will block until the spawned process exits, and then it will exit
    // with the same exit code as the spawned process.
    // In 'detached' mode, the spawned process will be detached from the current process and the current process will
    // continue to run normally.
    mode?: 'syncThenExit' | 'detached',
    flavor?: DebuggerShellFlavor,
  }> = {},
): Promise<void> {
  const [binaryPath, baseArgs] = getShellBinaryAndArgs(flavor);

  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, [...baseArgs, ...args], {
      stdio: 'inherit',
      windowsHide: true,
      detached: mode === 'detached',
    });
    if (mode === 'detached') {
      child.on('spawn', () => {
        resolve();
      });
      child.on('close', (code: number) => {
        if (code !== 0) {
          reject(
            new Error(
              `Failed to open debugger shell: exited with code ${code}`,
            ),
          );
        }
      });
      child.unref();
    } else if (mode === 'syncThenExit') {
      child.on('close', function (code, signal) {
        if (code === null) {
          console.error('Debugger shell exited with signal', signal);
          process.exit(1);
        }
        process.exit(code);
      });

      const handleTerminationSignal = function (signal: string) {
        process.on(signal, function signalHandler() {
          if (!child.killed) {
            child.kill(signal);
          }
        });
      };

      handleTerminationSignal('SIGINT');
      handleTerminationSignal('SIGTERM');
    }
  });
}

export type DebuggerShellPreparationResult = $ReadOnly<{
  code:
    | 'success'
    | 'not_implemented'
    | 'likely_offline'
    | 'platform_not_supported'
    | 'possible_corruption'
    | 'unexpected_error',
  humanReadableMessage?: string,
  verboseInfo?: string,
}>;

/**
 * Attempts to prepare the debugger shell for use and returns a coded result
 * that can be used to advise the user on how to proceed in case of failure.
 * In particular, this function will attempt to download and extract an
 * appropriate binary for the "prebuilt" flavor.
 *
 * This function should be called early during dev server startup, in parallel
 * with other initialization steps, so that the debugger shell is ready to use
 * instantly when the user tries to open it (and conversely, the user is
 * informed ASAP if it is not ready to use).
 */
async function unstable_prepareDebuggerShell(
  flavor: DebuggerShellFlavor,
): Promise<DebuggerShellPreparationResult> {
  const [binaryPath, baseArgs] = getShellBinaryAndArgs(flavor);

  try {
    switch (flavor) {
      case 'prebuilt':
        const prebuiltResult = await prepareDebuggerShellFromDotSlashFile(
          DEVTOOLS_BINARY_DOTSLASH_FILE,
        );
        if (prebuiltResult.code !== 'success') {
          return prebuiltResult;
        }
        break;
      case 'dev':
        break;
      default:
        flavor as empty;
        throw new Error(`Unknown flavor: ${flavor}`);
    }
    const {code, stderr} = await spawnAndGetStderr(binaryPath, [
      ...baseArgs,
      '--version',
    ]);
    if (code !== 0) {
      return {
        code: 'unexpected_error',
        verboseInfo: stderr,
      };
    }
    return {code: 'success'};
  } catch (e) {
    return {
      code: 'unexpected_error',
      verboseInfo: e.message,
    };
  }
}

function getShellBinaryAndArgs(
  flavor: DebuggerShellFlavor,
): [string, Array<string>] {
  switch (flavor) {
    case 'prebuilt':
      return [
        // $FlowFixMe[cannot-resolve-module] fb-dotslash includes Flow types but Flow does not pick them up
        require('fb-dotslash'),
        [DEVTOOLS_BINARY_DOTSLASH_FILE],
      ];
    case 'dev':
      return [
        // NOTE: Internally at Meta, this is aliased to a workspace that is
        // API-compatible with the 'electron' package, but contains prebuilt binaries
        // that do not need to be downloaded in a postinstall action.
        require('electron'),
        [require.resolve('../electron')],
      ];
    default:
      flavor as empty;
      throw new Error(`Unknown flavor: ${flavor}`);
  }
}

export {unstable_spawnDebuggerShellWithArgs, unstable_prepareDebuggerShell};

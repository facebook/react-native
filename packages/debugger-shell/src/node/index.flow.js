/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {spawn} = require('cross-spawn');

async function unstable_spawnDebuggerShellWithArgs(
  args: string[],
  {
    mode = 'detached',
  }: $ReadOnly<{
    // In 'syncAndExit' mode, the current process will block until the spawned process exits, and then it will exit
    // with the same exit code as the spawned process.
    // In 'detached' mode, the spawned process will be detached from the current process and the current process will
    // continue to run normally.
    mode?: 'syncThenExit' | 'detached',
  }> = {},
): Promise<void> {
  // NOTE: Internally at Meta, this is aliased to a workspace that is
  // API-compatible with the 'electron' package, but contains prebuilt binaries
  // that do not need to be downloaded in a postinstall action.
  const electronPath = require('electron');

  return new Promise((resolve, reject) => {
    const child = spawn(
      electronPath,
      [require.resolve('../electron'), ...args],
      {
        stdio: 'inherit',
        windowsHide: true,
        detached: mode === 'detached',
      },
    );
    if (mode === 'detached') {
      child.on('spawn', () => {
        resolve();
      });
      child.on('close', (code /*: number */) => {
        if (code !== 0) {
          reject(
            new Error(
              `Failed to open debugger shell: ${electronPath} exited with code ${code}`,
            ),
          );
        }
      });
      child.unref();
    } else if (mode === 'syncThenExit') {
      child.on('close', function (code, signal) {
        if (code === null) {
          console.error(electronPath, 'exited with signal', signal);
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

export {unstable_spawnDebuggerShellWithArgs};

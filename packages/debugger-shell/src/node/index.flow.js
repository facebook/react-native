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
const path = require('path');

// The 'prebuilt' flavor will use the prebuilt shell binary (and the JavaScript embedded in it).
// The 'dev' flavor will use a stock Electron binary and run the shell code from the `electron/` directory.
type DebuggerShellFlavor = 'prebuilt' | 'dev';

async function unstable_spawnDebuggerShellWithArgs(
  args: string[],
  {
    mode = 'detached',
    flavor = 'dev',
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

function getShellBinaryAndArgs(
  flavor: DebuggerShellFlavor,
): [string, Array<string>] {
  switch (flavor) {
    case 'prebuilt':
      return [
        // $FlowIssue[cannot-resolve-module] fb-dotslash includes Flow types but Flow does not pick them up
        require('fb-dotslash'),
        [path.join(__dirname, '../../bin/react-native-devtools')],
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

export {unstable_spawnDebuggerShellWithArgs};

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

const {unstable_spawnDebuggerShellWithArgs} = require('../../');

describe('debugger-shell Node package', () => {
  test('can spawn in detached+prebuilt mode without crashing', async () => {
    await expect(
      unstable_spawnDebuggerShellWithArgs(['--version'], {
        flavor: 'prebuilt',
        mode: 'detached',
      }),
    ).resolves.toBeUndefined();
  });

  // When running in the internal react-native-oss-js job, Electron isn't
  // installed correctly (postinstall scripts don't run) but the internal
  // `electron` workspace isn't available either. Detecting this dynamically
  // weakens the test somewhat in environments where it *should* pass, but this
  // is a dev-only feature anyway so this is fine.
  if (isElectronInstalled()) {
    test('can spawn in detached+dev mode without crashing', async () => {
      await expect(
        unstable_spawnDebuggerShellWithArgs(['--version'], {
          flavor: 'dev',
          mode: 'detached',
        }),
      ).resolves.toBeUndefined();
    });
  }
});

function isElectronInstalled() {
  try {
    require('electron');
    return true;
  } catch {
    return false;
  }
}

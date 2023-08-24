/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

import type {LaunchedChrome} from 'chrome-launcher';
import {promises as fs} from 'fs';
import path from 'path';
import osTempDir from 'temp-dir';

const ChromeLauncher = require('chrome-launcher');
const {Launcher: EdgeLauncher} = require('chromium-edge-launcher');

/**
 * Attempt to open a debugger frontend URL as a Google Chrome app window.
 */
export default async function launchDebuggerAppWindow(
  url: string,
  /**
   * Used to construct the temp browser dir to preserve settings such as window
   * position.
   */
  intent: 'open-debugger',
): Promise<LaunchedChrome> {
  let browserType = 'chrome';
  let chromePath;

  try {
    // Locate Chrome installation path, will throw if not found
    chromePath = ChromeLauncher.getChromePath();
  } catch (e) {
    browserType = 'edge';
    chromePath = EdgeLauncher.getFirstInstallation();

    if (chromePath == null) {
      throw new Error(
        'Unable to find a browser on the host to open the debugger. ' +
          'Supported browsers: Google Chrome, Microsoft Edge.\n' +
          url,
      );
    }
  }

  const userDataDir = await createTempDir(
    `react-native-${intent}-${browserType}`,
  );

  return ChromeLauncher.launch({
    chromePath,
    chromeFlags: [
      `--app=${url}`,
      `--user-data-dir=${userDataDir}`,
      '--window-size=1200,600',
    ],
  });
}

async function createTempDir(dirName: string): Promise<string> {
  const tempDir = path.join(osTempDir, dirName);

  await fs.mkdir(tempDir, {recursive: true});

  return tempDir;
}

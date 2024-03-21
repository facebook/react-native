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

import type {BrowserLauncher, LaunchedBrowser} from '../types/BrowserLauncher';

import {promises as fs} from 'fs';
import path from 'path';
import osTempDir from 'temp-dir';

const ChromeLauncher = require('chrome-launcher');
const {Launcher: EdgeLauncher} = require('chromium-edge-launcher');

/**
 * Default `BrowserLauncher` implementation which opens URLs on the host
 * machine.
 */
const DefaultBrowserLauncher: BrowserLauncher = {
  /**
   * Attempt to open the debugger frontend in a Google Chrome or Microsoft Edge
   * app window.
   */
  launchDebuggerAppWindow: async (url: string): Promise<LaunchedBrowser> => {
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
      `react-native-debugger-frontend-${browserType}`,
    );
    const launchedChrome = await ChromeLauncher.launch({
      chromePath,
      chromeFlags: [
        `--app=${url}`,
        `--user-data-dir=${userDataDir}`,
        '--window-size=1200,600',
      ],
    });

    return {
      kill: async () => launchedChrome.kill(),
    };
  },
};

async function createTempDir(dirName: string): Promise<string> {
  const tempDir = path.join(osTempDir, dirName);

  await fs.mkdir(tempDir, {recursive: true});

  return tempDir;
}

export default DefaultBrowserLauncher;

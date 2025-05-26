/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {BrowserLauncher} from '../types/BrowserLauncher';

const {spawn} = require('child_process');
const ChromeLauncher = require('chrome-launcher');
const {Launcher: EdgeLauncher} = require('chromium-edge-launcher');
const open = require('open');

/**
 * Default `BrowserLauncher` implementation which opens URLs on the host
 * machine.
 */
const DefaultBrowserLauncher: BrowserLauncher = {
  /**
   * Attempt to open the debugger frontend in a Google Chrome or Microsoft Edge
   * app window.
   */
  launchDebuggerAppWindow: async url => {
    let chromePath;

    try {
      // Locate Chrome installation path, will throw if not found
      chromePath = ChromeLauncher.getChromePath();
    } catch (e) {
      // Fall back to Microsoft Edge
      chromePath = EdgeLauncher.getFirstInstallation();
    }

    if (chromePath == null) {
      // Fall back to default browser - the frontend will warn if the browser
      // is not supported.
      await open(url);
      return;
    }

    const chromeFlags = [`--app=${url}`, '--window-size=1200,600'];

    return new Promise((resolve, reject) => {
      const childProcess = spawn(chromePath, chromeFlags, {
        detached: true,
        stdio: 'ignore',
      });

      childProcess.on('data', () => {
        resolve();
      });
      childProcess.on('close', (code: number) => {
        if (code !== 0) {
          reject(
            new Error(
              `Failed to launch debugger app window: ${chromePath} exited with code ${code}`,
            ),
          );
        }
      });
    });
  },
};

export default DefaultBrowserLauncher;

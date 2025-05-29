/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// $FlowFixMe[unclear-type] We have no Flow types for the Electron API.
const {BrowserWindow, app, shell} = require('electron') as any;
const util = require('util');

const windowMetadata = new WeakMap<
  typeof BrowserWindow,
  $ReadOnly<{
    windowKey: string,
  }>,
>();

function handleLaunchArgs(argv: string[]) {
  const {
    values: {frontendUrl, windowKey},
  } = util.parseArgs({
    options: {
      frontendUrl: {
        type: 'string',
      },
      windowKey: {
        type: 'string',
      },
    },
    args: argv,
  });

  // Find an existing window for this app and launch configuration.
  const existingWindow = BrowserWindow.getAllWindows().find(window => {
    const metadata = windowMetadata.get(window);
    if (!metadata) {
      return false;
    }
    return metadata.windowKey === windowKey;
  });

  if (existingWindow) {
    // If the window is already visible, flash it.
    if (existingWindow.isVisible()) {
      existingWindow.flashFrame(true);
      setTimeout(() => {
        existingWindow.flashFrame(false);
      }, 1000);
    }
    if (process.platform === 'darwin') {
      app.focus({
        steal: true,
      });
    }
    existingWindow.focus();
    return;
  }

  // Create the browser window.
  const frontendWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    webPreferences: {
      partition: 'persist:react-native-devtools',
    },
  });

  // Open links in the default browser instead of in new Electron windows.
  frontendWindow.webContents.setWindowOpenHandler(({url}) => {
    shell.openExternal(url);
    return {action: 'deny'};
  });

  frontendWindow.loadURL(frontendUrl);

  windowMetadata.set(frontendWindow, {
    windowKey,
  });

  if (process.platform === 'darwin') {
    app.focus({
      steal: true,
    });
  }
}

app.whenReady().then(() => {
  handleLaunchArgs(process.argv.slice(2));

  app.on(
    'second-instance',
    (event, electronArgv, workingDirectory, additionalData) => {
      handleLaunchArgs(additionalData.argv);
    },
  );
});

app.on('window-all-closed', function () {
  app.quit();
});

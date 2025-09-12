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
const {BrowserWindow, Menu, app, shell, ipcMain} = require('electron') as any;
const path = require('path');
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
  let frontendWindow = BrowserWindow.getAllWindows().find(window => {
    const metadata = windowMetadata.get(window);
    if (!metadata) {
      return false;
    }
    return metadata.windowKey === windowKey;
  });

  if (frontendWindow) {
    // If the window is already visible, flash it.
    if (frontendWindow.isVisible()) {
      frontendWindow.flashFrame(true);
      setTimeout(() => {
        frontendWindow.flashFrame(false);
      }, 1000);
    }
  } else {
    // Create the browser window.
    frontendWindow = new BrowserWindow({
      width: 1200,
      height: 600,
      webPreferences: {
        partition: 'persist:react-native-devtools',
        preload: require.resolve('./preload.js'),
      },
      // Icon for Linux
      icon: path.join(__dirname, 'resources', 'icon.png'),
    });
    // Auto-hide the Windows/Linux menu bar
    frontendWindow.setMenuBarVisibility(false);
  }

  // Open links in the default browser instead of in new Electron windows.
  frontendWindow.webContents.setWindowOpenHandler(({url}) => {
    shell.openExternal(url);
    return {action: 'deny'};
  });

  // TODO: If the window contains a live, working frontend instance with a valid connection to the backend,
  // we should avoid this reload and instead send the frontend a message to handle the launch arguments
  // dynamically (e.g. update the launch ID for telemetry purposes, handle deeplinking to a specific CDT panel, etc).
  frontendWindow.loadURL(frontendUrl);

  windowMetadata.set(frontendWindow, {
    windowKey,
  });

  if (process.platform === 'darwin') {
    app.focus({
      steal: true,
    });
  }
  frontendWindow.focus();
}

function configureAppMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{role: 'appMenu'}] : []),
    {role: 'fileMenu'},
    {role: 'editMenu'},
    {role: 'viewMenu'},
    {role: 'windowMenu'},
    {
      role: 'help',
      submenu: [
        {
          label: 'React Native Website',
          click: () => shell.openExternal('https://reactnative.dev'),
        },
        {
          label: 'Release Notes',
          click: () =>
            shell.openExternal(
              'https://github.com/facebook/react-native/releases',
            ),
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  handleLaunchArgs(process.argv.slice(app.isPackaged ? 1 : 2));
  configureAppMenu();

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

ipcMain.on('bringToFront', (event, title) => {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  if (win) {
    win.focus();
  }
  if (process.platform === 'darwin') {
    app.focus({
      steal: true,
    });
  }
});

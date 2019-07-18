/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */
'use strict';

const Platform = require('./Platform');
const invariant = require('invariant');

const MetroHMRClient = require('metro/src/lib/bundle-modules/HMRClient');

import NativeRedBox from '../NativeModules/specs/NativeRedBox';

import type {ExtendedError} from '../Core/Devtools/parseErrorStack';

const pendingEntryPoints = [];
let hmrClient = null;
let hmrUnavailableReason: string | null = null;
let isRegisteringEntryPoints = false;

export type HMRClientNativeInterface = {|
  enable(): void,
  disable(): void,
  registerBundle(requestUrl: string): void,
  setup(
    platform: string,
    bundleEntry: string,
    host: string,
    port: number | string,
    isEnabled: boolean,
  ): void,
|};

/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
const HMRClient: HMRClientNativeInterface = {
  enable() {
    if (hmrUnavailableReason !== null) {
      // If HMR became unavailable while you weren't using it,
      // explain why when you try to turn it on.
      // This is an error (and not a warning) because it is shown
      // in response to a direct user action.
      throw new Error(hmrUnavailableReason);
    }

    invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
    hmrClient.shouldApplyUpdates = true;

    // Intentionally reading it outside the condition
    // so that it's less likely we'd break it later.
    const modules = (require: any).getModules();
    if (hmrClient.outdatedModules.size > 0) {
      let message =
        "You've changed these files before turning on Fast Refresh: ";
      message +=
        Array.from(hmrClient.outdatedModules)
          .map(id => {
            const mod = modules[id];
            return getShortModuleName(mod.verboseName);
          })
          .join(', ') + '.';
      message +=
        "\n\nThese pending changes won't be reflected unless you save them again " +
        'or perform a full reload.';
      console.warn(message);
      // Don't warn about the same modules twice.
      hmrClient.outdatedModules.clear();
    }

    registerBundleEntryPoints(hmrClient);
  },

  disable() {
    invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
    // Note: we don't actually tear down the connection.
    // We just tell the client to ignore updates.
    // This lets us avoid reasonining about complex race conditions
    // if the user toggles the setting on and off.
    hmrClient.shouldApplyUpdates = false;
  },

  registerBundle(requestUrl: string) {
    invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
    pendingEntryPoints.push(requestUrl);
    registerBundleEntryPoints(hmrClient);
  },

  // Called once by the bridge on startup, even if Fast Refresh is off.
  // It creates the HMR client but doesn't actually set up the socket yet.
  setup(
    platform: string,
    bundleEntry: string,
    host: string,
    port: number | string,
    isEnabled: boolean,
  ) {
    invariant(platform, 'Missing required parameter `platform`');
    invariant(bundleEntry, 'Missing required paramenter `bundleEntry`');
    invariant(host, 'Missing required paramenter `host`');
    invariant(!hmrClient, 'Cannot initialize hmrClient twice');

    // Moving to top gives errors due to NativeModules not being initialized
    const LoadingView = require('./LoadingView');

    const wsHost = port !== null && port !== '' ? `${host}:${port}` : host;
    const client = new MetroHMRClient(`ws://${wsHost}/hot`);
    hmrClient = client;

    pendingEntryPoints.push(
      `ws://${wsHost}/hot?bundleEntry=${bundleEntry}&platform=${platform}`,
    );

    client.on('connection-error', e => {
      let error = `Fast Refresh isn't working because it cannot connect to the development server.

Try the following to fix the issue:
- Ensure that the Metro Server is running and available on the same network`;

      if (Platform.OS === 'ios') {
        error += `
- Ensure that the Metro server URL is correctly set in AppDelegate`;
      } else {
        error += `
- Ensure that your device/emulator is connected to your machine and has USB debugging enabled - run 'adb devices' to see a list of connected devices
- If you're on a physical device connected to the same machine, run 'adb reverse tcp:8081 tcp:8081' to forward requests from your device
- If your device is on the same Wi-Fi network, set 'Debug server host & port for device' in 'Dev settings' to your machine's IP address and the port of the local dev server - e.g. 10.0.1.1:8081`;
      }

      error += `

URL: ${host}:${port}

Error: ${e.message}`;

      setHMRUnavailableReason(error);
    });

    // This is intentionally called lazily, as these values change.
    function isFastRefreshActive() {
      return (
        // If HMR is disabled by the user, we're ignoring updates.
        client.shouldApplyUpdates && !isRegisteringEntryPoints
      );
    }

    client.on('bundle-registered', () => {
      isRegisteringEntryPoints = false;
    });

    function dismissRedbox() {
      if (
        Platform.OS === 'ios' &&
        NativeRedBox != null &&
        NativeRedBox.dismiss != null
      ) {
        NativeRedBox.dismiss();
      } else {
        const NativeExceptionsManager = require('../Core/NativeExceptionsManager')
          .default;
        NativeExceptionsManager &&
          NativeExceptionsManager.dismissRedbox &&
          NativeExceptionsManager.dismissRedbox();
      }
    }

    client.on('update-start', () => {
      if (isFastRefreshActive()) {
        LoadingView.showMessage('Refreshing...');
      }
    });

    client.on('update', () => {
      if (isFastRefreshActive()) {
        dismissRedbox();
      }
    });

    client.on('update-done', () => {
      LoadingView.hide();
    });

    client.on('error', data => {
      LoadingView.hide();

      if (data.type === 'GraphNotFoundError') {
        client.disable();
        setHMRUnavailableReason(
          'The Metro server has restarted since the last edit. Fast Refresh will be disabled until you reload the application.',
        );
      } else if (data.type === 'RevisionNotFoundError') {
        client.disable();
        setHMRUnavailableReason(
          'The Metro server and the client are out of sync. Fast Refresh will be disabled until you reload the application.',
        );
      } else if (isFastRefreshActive()) {
        // Even if there is already a redbox, syntax errors are more important.
        // Otherwise you risk seeing a stale runtime error while a syntax error is more recent.
        dismissRedbox();
        const error: ExtendedError = new Error(`${data.type} ${data.message}`);
        // Symbolicating compile errors is wasted effort
        // because the stack trace is meaningless:
        error.preventSymbolication = true;
        throw error;
      }
    });

    client.on('close', data => {
      LoadingView.hide();
      setHMRUnavailableReason(
        'Disconnected from the Metro server. Fast Refresh will be disabled until you reload the application.',
      );
    });

    // This sets up the socket. A better name would be open(), or perhaps
    // it should just connect in the constructor. We can change this name if we
    // cut a major Metro bump right after. This runs even if Fast Refresh is off.
    client.enable();
    // Don't confuse this with the enable/disable calls below which actually
    // enable or disable applying updates. (Yes, this is very confusing.)
    // TODO(gaearon): refactor this to reduce the confusion.

    if (isEnabled) {
      HMRClient.enable();
    } else {
      HMRClient.disable();
    }
  },
};

function setHMRUnavailableReason(reason) {
  invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
  if (hmrUnavailableReason !== null) {
    // Don't show more than one warning.
    return;
  }
  hmrUnavailableReason = reason;
  if (hmrClient.shouldApplyUpdates) {
    // If HMR is currently enabled, show a warning.
    console.warn(reason);
    // (Not using the `warning` module to prevent a Buck cycle.)
  }
}

// Returns the filename without the folder path.
// If file is called index.js, it does include the parent folder though.
function getShortModuleName(fullName) {
  const BEFORE_SLASH_RE = /^(.*)[\\\/]/;
  let shortName = fullName.replace(BEFORE_SLASH_RE, '');
  if (/^index\./.test(shortName)) {
    const match = fullName.match(BEFORE_SLASH_RE);
    if (match) {
      const pathBeforeSlash = match[1];
      if (pathBeforeSlash) {
        const folderName = pathBeforeSlash.replace(BEFORE_SLASH_RE, '');
        return folderName + '/' + shortName;
      }
    }
  }
  return shortName;
}

function registerBundleEntryPoints(client) {
  if (pendingEntryPoints.length > 0) {
    isRegisteringEntryPoints = true;
    client.send(
      JSON.stringify({
        type: 'register-entrypoints',
        entryPoints: pendingEntryPoints,
      }),
    );
    pendingEntryPoints.length = 0;
  }
}

module.exports = HMRClient;

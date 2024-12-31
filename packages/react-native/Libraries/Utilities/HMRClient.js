/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ExtendedError} from '../Core/ExtendedError';

import getDevServer from '../Core/Devtools/getDevServer';
import LogBox from '../LogBox/LogBox';
import NativeRedBox from '../NativeModules/specs/NativeRedBox';

const DevSettings = require('./DevSettings');
const Platform = require('./Platform');
const invariant = require('invariant');
const MetroHMRClient = require('metro-runtime/src/modules/HMRClient');
const prettyFormat = require('pretty-format');

const pendingEntryPoints = [];
let hmrClient = null;
let hmrUnavailableReason: string | null = null;
let currentCompileErrorMessage: string | null = null;
let didConnect: boolean = false;
let pendingLogs: Array<[LogLevel, $ReadOnlyArray<mixed>]> = [];
let pendingFuseboxConsoleNotification = false;

type LogLevel =
  | 'trace'
  | 'info'
  | 'warn'
  | 'error'
  | 'log'
  | 'group'
  | 'groupCollapsed'
  | 'groupEnd'
  | 'debug';

export type HMRClientNativeInterface = {|
  enable(): void,
  disable(): void,
  registerBundle(requestUrl: string): void,
  log(level: LogLevel, data: $ReadOnlyArray<mixed>): void,
  setup(
    platform: string,
    bundleEntry: string,
    host: string,
    port: number | string,
    isEnabled: boolean,
    scheme?: string,
  ): void,
  unstable_notifyFuseboxConsoleEnabled(): void,
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
    const DevLoadingView = require('./DevLoadingView');

    // We use this for internal logging only.
    // It doesn't affect the logic.
    hmrClient.send(JSON.stringify({type: 'log-opt-in'}));

    // When toggling Fast Refresh on, we might already have some stashed updates.
    // Since they'll get applied now, we'll show a banner.
    const hasUpdates = hmrClient.hasPendingUpdates();

    if (hasUpdates) {
      DevLoadingView.showMessage('Refreshing...', 'refresh');
    }
    try {
      hmrClient.enable();
    } finally {
      if (hasUpdates) {
        DevLoadingView.hide();
      }
    }

    // There could be a compile error while Fast Refresh was off,
    // but we ignored it at the time. Show it now.
    showCompileError();
  },

  disable() {
    invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
    hmrClient.disable();
  },

  registerBundle(requestUrl: string) {
    invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
    pendingEntryPoints.push(requestUrl);
    registerBundleEntryPoints(hmrClient);
  },

  log(level: LogLevel, data: $ReadOnlyArray<mixed>) {
    if (!hmrClient) {
      // Catch a reasonable number of early logs
      // in case hmrClient gets initialized later.
      pendingLogs.push([level, data]);
      if (pendingLogs.length > 100) {
        pendingLogs.shift();
      }
      return;
    }
    try {
      hmrClient.send(
        JSON.stringify({
          type: 'log',
          level,
          mode: global.RN$Bridgeless === true ? 'NOBRIDGE' : 'BRIDGE',
          data: data.map(item =>
            typeof item === 'string'
              ? item
              : prettyFormat.format(item, {
                  escapeString: true,
                  highlight: true,
                  maxDepth: 3,
                  min: true,
                  plugins: [prettyFormat.plugins.ReactElement],
                }),
          ),
        }),
      );
    } catch (error) {
      // If sending logs causes any failures we want to silently ignore them
      // to ensure we do not cause infinite-logging loops.
    }
  },

  unstable_notifyFuseboxConsoleEnabled() {
    if (!hmrClient) {
      pendingFuseboxConsoleNotification = true;
      return;
    }
    hmrClient.send(
      JSON.stringify({
        type: 'log',
        level: 'info',
        data: [
          '\n' +
            '\u001B[7m' +
            ' \u001B[1m💡 JavaScript logs have moved!\u001B[22m They can now be ' +
            'viewed in React Native DevTools. Tip: Type \u001B[1mj\u001B[22m in ' +
            'the terminal to open (requires Google Chrome or Microsoft Edge).' +
            '\u001B[27m' +
            '\n',
        ],
      }),
    );
    pendingFuseboxConsoleNotification = false;
  },

  // Called once by the bridge on startup, even if Fast Refresh is off.
  // It creates the HMR client but doesn't actually set up the socket yet.
  setup(
    platform: string,
    bundleEntry: string,
    host: string,
    port: number | string,
    isEnabled: boolean,
    scheme?: string = 'http',
  ) {
    invariant(platform, 'Missing required parameter `platform`');
    invariant(bundleEntry, 'Missing required parameter `bundleEntry`');
    invariant(host, 'Missing required parameter `host`');
    invariant(!hmrClient, 'Cannot initialize hmrClient twice');

    // Moving to top gives errors due to NativeModules not being initialized
    const DevLoadingView = require('./DevLoadingView');

    const serverHost = port !== null && port !== '' ? `${host}:${port}` : host;

    const serverScheme = scheme;

    const client = new MetroHMRClient(`${serverScheme}://${serverHost}/hot`);

    hmrClient = client;

    const {fullBundleUrl} = getDevServer();
    pendingEntryPoints.push(
      // HMRServer understands regular bundle URLs, so prefer that in case
      // there are any important URL parameters we can't reconstruct from
      // `setup()`'s arguments.
      fullBundleUrl ??
        `${serverScheme}://${serverHost}/hot?bundleEntry=${bundleEntry}&platform=${platform}`,
    );

    client.on('connection-error', e => {
      let error = `Cannot connect to Metro.

Try the following to fix the issue:
- Ensure that Metro is running and available on the same network`;

      if (Platform.OS === 'ios') {
        error += `
- Ensure that the Metro URL is correctly set in AppDelegate`;
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

    client.on('update-start', ({isInitialUpdate}) => {
      currentCompileErrorMessage = null;
      didConnect = true;

      if (client.isEnabled() && !isInitialUpdate) {
        DevLoadingView.showMessage('Refreshing...', 'refresh');
      }
    });

    client.on('update', ({isInitialUpdate}) => {
      if (client.isEnabled() && !isInitialUpdate) {
        dismissRedbox();
        LogBox.clearAllLogs();
      }
    });

    client.on('update-done', () => {
      DevLoadingView.hide();
    });

    client.on('error', data => {
      DevLoadingView.hide();

      if (data.type === 'GraphNotFoundError') {
        client.close();
        setHMRUnavailableReason(
          'Metro has restarted since the last edit. Reload to reconnect.',
        );
      } else if (data.type === 'RevisionNotFoundError') {
        client.close();
        setHMRUnavailableReason(
          'Metro and the client are out of sync. Reload to reconnect.',
        );
      } else {
        currentCompileErrorMessage = `${data.type} ${data.message}`;
        if (client.isEnabled()) {
          showCompileError();
        }
      }
    });

    client.on('close', closeEvent => {
      DevLoadingView.hide();

      // https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.1
      // https://www.rfc-editor.org/rfc/rfc6455.html#section-7.1.5
      const isNormalOrUnsetCloseReason =
        closeEvent == null ||
        closeEvent.code === 1000 ||
        closeEvent.code === 1005 ||
        closeEvent.code == null;

      setHMRUnavailableReason(
        `${
          isNormalOrUnsetCloseReason
            ? 'Disconnected from Metro.'
            : `Disconnected from Metro (${closeEvent.code}: "${closeEvent.reason}").`
        }

To reconnect:
- Ensure that Metro is running and available on the same network
- Reload this app (will trigger further help if Metro cannot be connected to)
      `,
      );
    });

    if (isEnabled) {
      HMRClient.enable();
    } else {
      HMRClient.disable();
    }

    registerBundleEntryPoints(hmrClient);
    flushEarlyLogs(hmrClient);
  },
};

function setHMRUnavailableReason(reason: string) {
  invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
  if (hmrUnavailableReason !== null) {
    // Don't show more than one warning.
    return;
  }
  hmrUnavailableReason = reason;

  // We only want to show a warning if Fast Refresh is on *and* if we ever
  // previously managed to connect successfully. We don't want to show
  // the warning to native engineers who use cached bundles without Metro.
  if (hmrClient.isEnabled() && didConnect) {
    console.warn(reason);
    // (Not using the `warning` module to prevent a Buck cycle.)
  }
}

function registerBundleEntryPoints(client: MetroHMRClient) {
  if (hmrUnavailableReason != null) {
    DevSettings.reload('Bundle Splitting – Metro disconnected');
    return;
  }

  if (pendingEntryPoints.length > 0) {
    client.send(
      JSON.stringify({
        type: 'register-entrypoints',
        entryPoints: pendingEntryPoints,
      }),
    );
    pendingEntryPoints.length = 0;
  }
}

function flushEarlyLogs(client: MetroHMRClient) {
  try {
    pendingLogs.forEach(([level, data]) => {
      HMRClient.log(level, data);
    });
    if (pendingFuseboxConsoleNotification) {
      HMRClient.unstable_notifyFuseboxConsoleEnabled();
    }
  } finally {
    pendingLogs.length = 0;
  }
}

function dismissRedbox() {
  if (
    Platform.OS === 'ios' &&
    NativeRedBox != null &&
    NativeRedBox.dismiss != null
  ) {
    NativeRedBox.dismiss();
  } else {
    const NativeExceptionsManager =
      require('../Core/NativeExceptionsManager').default;
    NativeExceptionsManager &&
      NativeExceptionsManager.dismissRedbox &&
      NativeExceptionsManager.dismissRedbox();
  }
}

function showCompileError() {
  if (currentCompileErrorMessage === null) {
    return;
  }

  // Even if there is already a redbox, syntax errors are more important.
  // Otherwise you risk seeing a stale runtime error while a syntax error is more recent.
  dismissRedbox();

  const message = currentCompileErrorMessage;
  currentCompileErrorMessage = null;

  /* $FlowFixMe[class-object-subtyping] added when improving typing for this
   * parameters */
  // $FlowFixMe[incompatible-type]
  const error: ExtendedError = new Error(message);
  // Symbolicating compile errors is wasted effort
  // because the stack trace is meaningless:
  error.preventSymbolication = true;
  throw error;
}

module.exports = HMRClient;

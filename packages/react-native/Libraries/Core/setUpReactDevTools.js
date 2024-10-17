/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {Domain} from '../../src/private/debugging/setUpFuseboxReactDevToolsDispatcher';
import type {Spec as NativeReactDevToolsRuntimeSettingsModuleSpec} from '../../src/private/fusebox/specs/NativeReactDevToolsRuntimeSettingsModule';

if (__DEV__) {
  // Register dispatcher on global, which can be used later by Chrome DevTools frontend
  require('../../src/private/debugging/setUpFuseboxReactDevToolsDispatcher');
  const {
    initialize,
    connectToDevTools,
    connectWithCustomMessagingProtocol,
  } = require('react-devtools-core');

  const reactDevToolsSettingsManager = require('../../src/private/debugging/ReactDevToolsSettingsManager');
  const serializedHookSettings =
    reactDevToolsSettingsManager.getGlobalHookSettings();
  const maybeReactDevToolsRuntimeSettingsModuleModule =
    require('../../src/private/fusebox/specs/NativeReactDevToolsRuntimeSettingsModule').default;

  let hookSettings = null;
  if (serializedHookSettings != null) {
    try {
      const parsedSettings = JSON.parse(serializedHookSettings);
      hookSettings = parsedSettings;
    } catch {
      console.error(
        'Failed to parse persisted React DevTools hook settings. React DevTools will be initialized with default settings.',
      );
    }
  }

  const {
    isProfiling: shouldStartProfilingNow,
    profilingSettings: initialProfilingSettings,
  } = readReloadAndProfileConfig(maybeReactDevToolsRuntimeSettingsModuleModule);

  // Install hook before React is loaded.
  initialize(hookSettings, shouldStartProfilingNow, initialProfilingSettings);

  // This should be defined in DEV, otherwise error is expected.
  const fuseboxReactDevToolsDispatcher =
    global.__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__;
  const reactDevToolsFuseboxGlobalBindingName =
    fuseboxReactDevToolsDispatcher.BINDING_NAME;

  const ReactNativeStyleAttributes = require('../Components/View/ReactNativeStyleAttributes');
  const resolveRNStyle = require('../StyleSheet/flattenStyle');

  function handleReactDevToolsSettingsUpdate(settings: Object) {
    reactDevToolsSettingsManager.setGlobalHookSettings(
      JSON.stringify(settings),
    );
  }

  let disconnect = null;
  function disconnectBackendFromReactDevToolsInFuseboxIfNeeded() {
    if (disconnect != null) {
      disconnect();
      disconnect = null;
    }
  }

  function connectToReactDevToolsInFusebox(domain: Domain) {
    const {
      isReloadAndProfileSupported,
      isProfiling,
      onReloadAndProfile,
      onReloadAndProfileFlagsReset,
    } = readReloadAndProfileConfig(
      maybeReactDevToolsRuntimeSettingsModuleModule,
    );
    disconnect = connectWithCustomMessagingProtocol({
      onSubscribe: listener => {
        domain.onMessage.addEventListener(listener);
      },
      onUnsubscribe: listener => {
        domain.onMessage.removeEventListener(listener);
      },
      onMessage: (event, payload) => {
        domain.sendMessage({event, payload});
      },
      nativeStyleEditorValidAttributes: Object.keys(ReactNativeStyleAttributes),
      resolveRNStyle,
      onSettingsUpdated: handleReactDevToolsSettingsUpdate,
      isReloadAndProfileSupported,
      isProfiling,
      onReloadAndProfile,
      onReloadAndProfileFlagsReset,
    });
  }

  let isWebSocketOpen = false;
  let ws = null;
  function connectToWSBasedReactDevToolsFrontend() {
    if (ws !== null && isWebSocketOpen) {
      // If the DevTools backend is already connected, don't recreate the WebSocket.
      // This would break the connection.
      // If there isn't an active connection, a backend may be waiting to connect,
      // in which case it's okay to make a new one.
      return;
    }

    // not when debugging in chrome
    // TODO(t12832058) This check is broken
    if (!window.document) {
      const AppState = require('../AppState/AppState');
      const getDevServer = require('./Devtools/getDevServer');

      // Don't steal the DevTools from currently active app.
      // Note: if you add any AppState subscriptions to this file,
      // you will also need to guard against `AppState.isAvailable`,
      // or the code will throw for bundles that don't have it.
      const isAppActive = () => AppState.currentState !== 'background';

      // Get hostname from development server (packager)
      const devServer = getDevServer();
      const host = devServer.bundleLoadedFromServer
        ? devServer.url
            .replace(/https?:\/\//, '')
            .replace(/\/$/, '')
            .split(':')[0]
        : 'localhost';

      // Read the optional global variable for backward compatibility.
      // It was added in https://github.com/facebook/react-native/commit/bf2b435322e89d0aeee8792b1c6e04656c2719a0.
      const port =
        window.__REACT_DEVTOOLS_PORT__ != null
          ? window.__REACT_DEVTOOLS_PORT__
          : 8097;

      const WebSocket = require('../WebSocket/WebSocket');
      ws = new WebSocket('ws://' + host + ':' + port);
      ws.addEventListener('close', event => {
        isWebSocketOpen = false;
      });
      ws.addEventListener('open', event => {
        isWebSocketOpen = true;
      });

      const {
        isReloadAndProfileSupported,
        isProfiling,
        onReloadAndProfile,
        onReloadAndProfileFlagsReset,
      } = readReloadAndProfileConfig(
        maybeReactDevToolsRuntimeSettingsModuleModule,
      );
      connectToDevTools({
        isAppActive,
        resolveRNStyle,
        nativeStyleEditorValidAttributes: Object.keys(
          ReactNativeStyleAttributes,
        ),
        websocket: ws,
        onSettingsUpdated: handleReactDevToolsSettingsUpdate,
        isReloadAndProfileSupported,
        isProfiling,
        onReloadAndProfile,
        onReloadAndProfileFlagsReset,
      });
    }
  }

  // 1. If React DevTools has already been opened and initialized in Fusebox, bindings survive reloads
  if (global[reactDevToolsFuseboxGlobalBindingName] != null) {
    disconnectBackendFromReactDevToolsInFuseboxIfNeeded();
    const domain =
      fuseboxReactDevToolsDispatcher.initializeDomain('react-devtools');
    connectToReactDevToolsInFusebox(domain);
  }

  // 2. If React DevTools panel in Fusebox was opened for the first time after the runtime has been created
  // 2. OR if React DevTools frontend was re-initialized: Chrome DevTools was closed and then re-opened
  global.__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__.onDomainInitialization.addEventListener(
    (domain: Domain) => {
      if (domain.name === 'react-devtools') {
        disconnectBackendFromReactDevToolsInFuseboxIfNeeded();
        connectToReactDevToolsInFusebox(domain);
      }
    },
  );

  // 3. Fallback to attempting to connect WS-based RDT frontend
  const RCTNativeAppEventEmitter = require('../EventEmitter/RCTNativeAppEventEmitter');
  RCTNativeAppEventEmitter.addListener(
    'RCTDevMenuShown',
    connectToWSBasedReactDevToolsFrontend,
  );
  connectToWSBasedReactDevToolsFrontend(); // Try connecting once on load
}

function readReloadAndProfileConfig(
  maybeModule: ?NativeReactDevToolsRuntimeSettingsModuleSpec,
) {
  const isReloadAndProfileSupported = maybeModule != null;
  const config = maybeModule?.getReloadAndProfileConfig();
  const isProfiling = config?.shouldReloadAndProfile === true;
  const profilingSettings = {
    recordChangeDescriptions: config?.recordChangeDescriptions === true,
    recordTimeline: false,
  };
  const onReloadAndProfile = (recordChangeDescriptions: boolean) => {
    if (maybeModule == null) {
      return;
    }

    maybeModule.setReloadAndProfileConfig({
      shouldReloadAndProfile: true,
      recordChangeDescriptions,
    });
  };
  const onReloadAndProfileFlagsReset = () => {
    if (maybeModule == null) {
      return;
    }

    maybeModule.setReloadAndProfileConfig({
      shouldReloadAndProfile: false,
      recordChangeDescriptions: false,
    });
  };

  return {
    isReloadAndProfileSupported,
    isProfiling,
    profilingSettings,
    onReloadAndProfile,
    onReloadAndProfileFlagsReset,
  };
}

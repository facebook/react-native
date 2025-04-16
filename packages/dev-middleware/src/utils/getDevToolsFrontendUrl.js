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

import type {Experiments} from '../types/Experiments';

/**
 * Get the DevTools frontend URL to debug a given React Native CDP target.
 */
export default function getDevToolsFrontendUrl(
  experiments: Experiments,
  webSocketDebuggerUrl: string,
  devServerUrl: string,
  options?: $ReadOnly<{
    relative?: boolean,
    launchId?: string,
    telemetryInfo?: string,
    /** Whether to use the modern `rn_fusebox.html` entry point. */
    useFuseboxEntryPoint?: boolean,
    appId?: string,
  }>,
): string {
  const wsParam = getWsParam({
    webSocketDebuggerUrl,
    devServerUrl,
  });

  const appUrl =
    (options?.relative === true ? '' : devServerUrl) +
    '/debugger-frontend/' +
    (options?.useFuseboxEntryPoint === true
      ? 'rn_fusebox.html'
      : 'rn_inspector.html');

  const searchParams = new URLSearchParams([
    [wsParam.key, wsParam.value],
    ['sources.hide_add_folder', 'true'],
  ]);
  if (experiments.enableNetworkInspector) {
    searchParams.append('unstable_enableNetworkPanel', 'true');
  }
  if (options?.launchId != null && options.launchId !== '') {
    searchParams.append('launchId', options.launchId);
  }
  if (options?.appId != null && options.appId !== '') {
    searchParams.append('appId', options.appId);
  }
  if (options?.telemetryInfo != null && options.telemetryInfo !== '') {
    searchParams.append('telemetryInfo', options.telemetryInfo);
  }

  return appUrl + '?' + searchParams.toString();
}

function getWsParam({
  webSocketDebuggerUrl,
  devServerUrl,
}: $ReadOnly<{
  webSocketDebuggerUrl: string,
  devServerUrl: string,
}>): {
  key: string,
  value: string,
} {
  const wsUrl = new URL(webSocketDebuggerUrl);
  const serverHost = new URL(devServerUrl).host;
  let value;
  if (wsUrl.host === serverHost) {
    // Use a path-absolute (host-relative) URL if the WS server and frontend
    // server are colocated. This is more robust for cases where the frontend
    // may actually load through a tunnel or proxy, and the WS connection
    // should therefore do the same.
    //
    // Depends on https://github.com/facebook/react-native-devtools-frontend/pull/4
    value = wsUrl.pathname + wsUrl.search + wsUrl.hash;
  } else {
    // Standard URL format accepted by the DevTools frontend
    value = wsUrl.host + wsUrl.pathname + wsUrl.search + wsUrl.hash;
  }
  const key = wsUrl.protocol.slice(0, -1);
  return {key, value};
}

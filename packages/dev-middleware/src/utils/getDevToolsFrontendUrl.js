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
): string {
  const scheme = new URL(webSocketDebuggerUrl).protocol.slice(0, -1);
  const webSocketUrlWithoutProtocol = webSocketDebuggerUrl.replace(
    /^wss?:\/\//,
    '',
  );
  const appUrl = `${devServerUrl}/debugger-frontend/rn_inspector.html`;

  const searchParams = new URLSearchParams([
    [scheme, webSocketUrlWithoutProtocol],
    ['sources.hide_add_folder', 'true'],
  ]);
  if (experiments.enableNetworkInspector) {
    searchParams.append('unstable_enableNetworkPanel', 'true');
  }

  return appUrl + '?' + searchParams.toString();
}

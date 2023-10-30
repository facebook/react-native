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

/**
 * Get the DevTools frontend URL to debug a given React Native CDP target.
 */
export default function getDevToolsFrontendUrl(
  webSocketDebuggerUrl: string,
  devServerUrl: string,
): string {
  const scheme = new URL(webSocketDebuggerUrl).protocol.slice(0, -1);
  const appUrl = `${devServerUrl}/debugger-frontend/rn_inspector.html`;
  const webSocketUrlWithoutProtocol = encodeURIComponent(
    webSocketDebuggerUrl.replace(/^wss?:\/\//, ''),
  );

  return `${appUrl}?${scheme}=${webSocketUrlWithoutProtocol}&sources.hide_add_folder=true`;
}

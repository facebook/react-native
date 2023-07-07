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

import fetch from 'node-fetch';

type ReactNativeCDPTarget = {
  id: string,
  description: string,
  title: string,
  type: string,
  devtoolsFrontendUrl: string,
  webSocketDebuggerUrl: string,
  vm: string,
  deviceName?: string,
};

/**
 * Get the list of available debug targets from the React Native dev server.
 *
 * @see https://chromedevtools.github.io/devtools-protocol/
 */
export default async function queryInspectorTargets(
  devServerUrl: string,
): Promise<ReactNativeCDPTarget[]> {
  const res = await fetch(`${devServerUrl}/json/list`);
  const apps = (await res.json(): Array<ReactNativeCDPTarget>);

  // Only use targets with better reloading support
  return apps.filter(
    app => app.title === 'React Native Experimental (Improved Chrome Reloads)',
  );
}

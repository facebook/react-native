/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RunServerResult} from 'metro';

type MetroServer = $NonMaybeType<RunServerResult?.['httpServer']>;

declare var __METRO_SERVER__: ?RunServerResult;

function getMetroServer(): ?MetroServer {
  return typeof __METRO_SERVER__ !== 'undefined' && __METRO_SERVER__ != null
    ? __METRO_SERVER__.httpServer
    : null;
}

export default async function globalTeardown(
  globalConfig: {...},
  projectConfig: {...},
): Promise<void> {
  const metroServer = getMetroServer();
  if (metroServer) {
    await stopMetroServer(metroServer);
  }
}

async function stopMetroServer(metroServer: MetroServer): Promise<void> {
  return new Promise((resolve, reject) => {
    metroServer.close(error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

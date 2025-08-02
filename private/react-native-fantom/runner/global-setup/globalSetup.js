/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {isOSS, validateEnvironmentVariables} from '../EnvironmentOptions';
import build from './build';
import Metro from 'metro';
import path from 'path';

export default async function globalSetup(
  globalConfig: {...},
  projectConfig: {...},
): Promise<void> {
  process.env.__FANTOM_RUN_ID__ ??= `run-${Date.now()}`;

  validateEnvironmentVariables();

  await startMetroServer();

  if (!isOSS) {
    await build();
  }
}

async function startMetroServer() {
  const metroConfig = await Metro.loadConfig({
    config: path.resolve(__dirname, '..', '..', 'config', 'metro.config.js'),
  });

  // We need to reuse the same port across runs because can only set environment
  // variables for workers in the first one.
  // $FlowExpectedError[cannot-write]
  metroConfig.server.port =
    process.env.__FANTOM_METRO_PORT__ != null
      ? Number(process.env.__FANTOM_METRO_PORT__)
      : // Any available port
        0;

  const server = await Metro.runServer(metroConfig, {
    waitForBundler: true,
    watch: true,
  });

  if (process.env.__FANTOM_METRO_PORT__ == null) {
    process.env.__FANTOM_METRO_PORT__ = String(
      server.httpServer.address().port,
    );
  }

  // $FlowExpectedError[prop-missing]
  globalThis.__METRO_SERVER__ = server;
}

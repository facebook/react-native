/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ConfigT} from 'metro-config';

import {isOSS, validateEnvironmentVariables} from '../EnvironmentOptions';
import {PROJECT_ROOT} from '../paths';
import build from './build';
import {createDevMiddleware} from '@react-native/dev-middleware';
import connect from 'connect';
import Metro from 'metro';
import {Server} from 'net';
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

  if (process.env.__FANTOM_METRO_PORT__ == null) {
    const availablePort = await findAvailablePort();
    process.env.__FANTOM_METRO_PORT__ = String(availablePort);
  }

  // We need to reuse the same port across runs because can only set environment
  // variables for workers in the first one.
  // $FlowExpectedError[cannot-write]
  metroConfig.server.port = Number(process.env.__FANTOM_METRO_PORT__);

  const {
    middleware: devMiddleware,
    websocketEndpoints: debuggerWebsocketEndpoints,
  } = createDevMiddleware({
    projectRoot: PROJECT_ROOT,
    serverBaseUrl: `http://localhost:${metroConfig.server.port}`,
  });

  const enhanceMiddleware: ConfigT['server']['enhanceMiddleware'] = (
    metroMiddleware,
    metroServer,
  ) => {
    const server = connect();
    server.use(metroMiddleware);
    server.use(devMiddleware);
    return server;
  };

  // $FlowExpectedError[cannot-write]
  metroConfig.server.enhanceMiddleware = enhanceMiddleware;

  const server = await Metro.runServer(metroConfig, {
    waitForBundler: true,
    watch: true,
    websocketEndpoints: {
      ...debuggerWebsocketEndpoints,
    },
  });

  // $FlowExpectedError[prop-missing]
  globalThis.__FANTOM_METRO_SERVER__ = server;
}

async function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = new Server();
    server.listen(0, 'localhost', undefined, () => {
      const port = server.address().port;
      server.close(error => {
        if (error != null) {
          reject(error);
        } else {
          resolve(port);
        }
      });
    });
    server.on('error', reject);
  });
}

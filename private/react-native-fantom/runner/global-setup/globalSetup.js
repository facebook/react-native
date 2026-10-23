/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {DevToolLauncher} from '@react-native/dev-middleware';

import {
  debugJS,
  isOSS,
  validateEnvironmentVariables,
} from '../EnvironmentOptions';
import {getTestBuildOutputPath} from '../paths';
import build from './build';
import {createDevMiddleware} from '@react-native/dev-middleware';
import * as Metro from 'metro';
import {Server} from 'node:net';
import path from 'node:path';
import open from 'open';

export default async function globalSetup(
  globalConfig: {
    collectCoverage: boolean,
    ...
  },
  projectConfig: {...},
): Promise<void> {
  process.env.__FANTOM_RUN_ID__ ??= `run-${Date.now()}`;

  validateEnvironmentVariables();

  await startMetroServer();

  if (!isOSS) {
    await build(globalConfig.collectCoverage, {
      LLVM_PROFILE_FILE: globalConfig.collectCoverage
        ? getTestBuildOutputPath() + 'fantom.profraw'
        : undefined,
    });
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

  const serverBaseUrl = `http://localhost:${metroConfig.server.port}`;
  const debuggerLaunches = new Map<string, Map<string, Promise<void>>>();
  const devToolLauncher: DevToolLauncher = {
    launchDebuggerAppWindow: async (url: string) => {
      if (!debugJS) {
        return;
      }
      const frontendUrl = new URL(url);
      const inspectorUrl = new URL(
        frontendUrl.searchParams.get('ws') ??
          frontendUrl.searchParams.get('wss') ??
          '',
        frontendUrl,
      );
      const deviceId = inspectorUrl.searchParams.get('device');
      const launches =
        deviceId == null ? undefined : debuggerLaunches.get(deviceId);
      if (launches == null) {
        await launchChromeDebugger(url);
        return;
      }
      let launch = launches.get(url);
      if (launch == null) {
        launch = launchChromeDebugger(url);
        launches.set(url, launch);
      }
      try {
        await launch;
      } catch (error) {
        if (launches.get(url) === launch) {
          launches.delete(url);
        }
        throw error;
      }
    },
  };

  const {
    middleware: devMiddleware,
    websocketEndpoints: debuggerWebsocketEndpoints,
  } = createDevMiddleware({
    serverBaseUrl,
    unstable_toolLauncher: devToolLauncher,
    unstable_experiments: {
      enableStandaloneFuseboxShell: false,
    },
  });

  debuggerWebsocketEndpoints['/inspector/device'].on(
    'connection',
    (socket, request) => {
      const deviceId = new URL(
        request.url ?? '',
        serverBaseUrl,
      ).searchParams.get('device');
      if (deviceId == null) {
        return;
      }
      const launches = new Map<string, Promise<void>>();
      debuggerLaunches.set(deviceId, launches);
      socket.on('close', () => {
        if (debuggerLaunches.get(deviceId) === launches) {
          debuggerLaunches.delete(deviceId);
        }
      });
    },
  );

  const server = await Metro.runServer(metroConfig, {
    unstable_extraMiddleware: [devMiddleware],
    waitForBundler: true,
    watch: true,
    websocketEndpoints: {
      ...debuggerWebsocketEndpoints,
    },
  });

  // $FlowExpectedError[prop-missing]
  globalThis.__FANTOM_METRO_SERVER__ = server;
}

async function launchChromeDebugger(url: string): Promise<void> {
  const subprocess = await open.openApp(open.apps.chrome, {
    arguments: [`--app=${url}`],
    newInstance: true,
  });
  let stderr = '';
  subprocess.stderr?.on('data', data => {
    stderr += data.toString();
  });
  await new Promise<void>((resolve, reject) => {
    subprocess.once('error', reject);
    subprocess.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        const error = new Error(
          `Could not launch Fantom DevTools: ${stderr.trim() || `Chrome exited with code ${String(code)}, signal ${String(signal)}`}`,
        );
        console.error(error.message);
        reject(error);
      }
    });
  });
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

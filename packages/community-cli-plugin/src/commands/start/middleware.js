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

import type {NextHandleFunction, Server} from 'connect';
import type {TerminalReportableEvent} from 'metro/src/lib/TerminalReporter';

const debug = require('debug')('ReactNative:CommunityCliPlugin');

type MiddlewareReturn = {
  middleware: Server,
  websocketEndpoints: {
    [path: string]: ws$WebSocketServer,
  },
  messageSocketEndpoint: {
    server: ws$WebSocketServer,
    broadcast: (method: string, params?: Record<string, mixed> | null) => void,
  },
  eventsSocketEndpoint: {
    server: ws$WebSocketServer,
    reportEvent: (event: TerminalReportableEvent) => void,
  },
  ...
};

const noopNextHandle: NextHandleFunction = (req, res, next) => {
  next();
};

// $FlowFixMe
const unusedStubWSServer: ws$WebSocketServer = {};
// $FlowFixMe
const unusedMiddlewareStub: Server = {};

// Create a simple middleware function that just passes control to the next middleware
const noopNextHandle = (req: any, res: any, next: () => void) => {
  next();
};

// Create an object with a handle method to be compatible with Connect middleware
const noopMiddlewareWithHandle = {
  handle: noopNextHandle
};

const communityMiddlewareFallback = {
  createDevServerMiddleware: (params: {
    host?: string,
    port: number,
    watchFolders: $ReadOnlyArray<string>,
  }): MiddlewareReturn => ({
    middleware: unusedMiddlewareStub,
    websocketEndpoints: {},
    messageSocketEndpoint: {
      server: unusedStubWSServer,
      broadcast: (
        method: string,
        _params?: Record<string, mixed> | null,
      ): void => {},
    },
    eventsSocketEndpoint: {
      server: unusedStubWSServer,
      reportEvent: (event: TerminalReportableEvent) => {},
    },
  }),
  indexPageMiddleware: noopMiddlewareWithHandle,
};

// Attempt to use the community middleware if it exists, but fallback to
// the stubs if it doesn't.
try {
  const community = require('@react-native-community/cli-server-api');
  communityMiddlewareFallback.indexPageMiddleware =
    community.indexPageMiddleware;
  communityMiddlewareFallback.createDevServerMiddleware =
    community.createDevServerMiddleware;
  
// Import and safely use indexPageMiddleware if it exists
try {
  const community = require(communityCliServerApiPath);
  // Check if the imported indexPageMiddleware exists and wrap it in an object with handle method if needed
  if (community.indexPageMiddleware) {
    if (typeof community.indexPageMiddleware === 'function') {
      communityMiddlewareFallback.indexPageMiddleware = {
        handle: community.indexPageMiddleware
      };
    } else {
      communityMiddlewareFallback.indexPageMiddleware = community.indexPageMiddleware;
    }
  }
} catch (e) {
  debug('Failed to import indexPageMiddleware from community CLI, using fallback');
}
} catch {
  debug(`⚠️ Unable to find @react-native-community/cli-server-api
Starting the server without the community middleware.`);
}

export const createDevServerMiddleware =
  communityMiddlewareFallback.createDevServerMiddleware;
export const indexPageMiddleware =
  communityMiddlewareFallback.indexPageMiddleware;

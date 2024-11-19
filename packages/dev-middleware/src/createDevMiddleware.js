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

import type {CreateCustomMessageHandlerFn} from './inspector-proxy/CustomMessageHandler';
import type {BrowserLauncher} from './types/BrowserLauncher';
import type {EventReporter} from './types/EventReporter';
import type {Experiments, ExperimentsConfig} from './types/Experiments';
import type {Logger} from './types/Logger';
import type {NextHandleFunction} from 'connect';

import InspectorProxy from './inspector-proxy/InspectorProxy';
import openDebuggerMiddleware from './middleware/openDebuggerMiddleware';
import DefaultBrowserLauncher from './utils/DefaultBrowserLauncher';
import reactNativeDebuggerFrontendPath from '@react-native/debugger-frontend';
import connect from 'connect';
import path from 'path';
import serveStaticMiddleware from 'serve-static';

type Options = $ReadOnly<{
  projectRoot: string,

  /**
   * The base URL to the dev server, as reachable from the machine on which
   * dev-middleware is hosted. Typically `http://localhost:${metroPort}`.
   */
  serverBaseUrl: string,

  logger?: Logger,

  /**
   * An interface for integrators to provide a custom implementation for
   * opening URLs in a web browser.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_browserLauncher?: BrowserLauncher,

  /**
   * An interface for logging events.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_eventReporter?: EventReporter,

  /**
   * The set of experimental features to enable.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_experiments?: ExperimentsConfig,

  /**
   * Create custom handler to add support for unsupported CDP events, or debuggers.
   * This handler is instantiated per logical device and debugger pair.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_customInspectorMessageHandler?: CreateCustomMessageHandlerFn,
}>;

type DevMiddlewareAPI = $ReadOnly<{
  middleware: NextHandleFunction,
  websocketEndpoints: {[path: string]: ws$WebSocketServer},
}>;

export default function createDevMiddleware({
  projectRoot,
  serverBaseUrl,
  logger,
  unstable_browserLauncher = DefaultBrowserLauncher,
  unstable_eventReporter,
  unstable_experiments: experimentConfig = {},
  unstable_customInspectorMessageHandler,
}: Options): DevMiddlewareAPI {
  const experiments = getExperiments(experimentConfig);

  const inspectorProxy = new InspectorProxy(
    projectRoot,
    serverBaseUrl,
    unstable_eventReporter,
    experiments,
    unstable_customInspectorMessageHandler,
  );

  const middleware = connect()
    .use(
      '/open-debugger',
      openDebuggerMiddleware({
        serverBaseUrl,
        inspectorProxy,
        browserLauncher: unstable_browserLauncher,
        eventReporter: unstable_eventReporter,
        experiments,
        logger,
      }),
    )
    .use(
      '/debugger-frontend/embedder-static/embedderScript.js',
      (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.end('');
      },
    )
    .use(
      '/debugger-frontend',
      serveStaticMiddleware(path.join(reactNativeDebuggerFrontendPath), {
        fallthrough: false,
      }),
    )
    .use((...args) => inspectorProxy.processRequest(...args));

  return {
    middleware,
    websocketEndpoints: inspectorProxy.createWebSocketListeners(),
  };
}

function getExperiments(config: ExperimentsConfig): Experiments {
  return {
    enableOpenDebuggerRedirect: config.enableOpenDebuggerRedirect ?? false,
    enableNetworkInspector: config.enableNetworkInspector ?? false,
  };
}

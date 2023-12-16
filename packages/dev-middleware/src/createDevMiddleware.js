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

import type {BrowserLauncher} from './types/BrowserLauncher';
import type {EventReporter} from './types/EventReporter';
import type {Experiments, ExperimentsConfig} from './types/Experiments';
import type {Logger} from './types/Logger';
import type {NextHandleFunction} from 'connect';

import InspectorProxy from './inspector-proxy/InspectorProxy';
import deprecated_openFlipperMiddleware from './middleware/deprecated_openFlipperMiddleware';
import openDebuggerMiddleware from './middleware/openDebuggerMiddleware';
import DefaultBrowserLauncher from './utils/DefaultBrowserLauncher';
import reactNativeDebuggerFrontendPath from '@react-native/debugger-frontend';
import connect from 'connect';
import path from 'path';
import serveStaticMiddleware from 'serve-static';

type Options = $ReadOnly<{
  projectRoot: string,

  /**
   * The base URL to the dev server, as addressible from the local developer
   * machine. This is used in responses which return URLs to other endpoints,
   * e.g. the debugger frontend and inspector proxy targets.
   *
   * Example: `'http://localhost:8081'`.
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
   * An interface for using a modified inspector proxy implementation.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_InspectorProxy?: Class<InspectorProxy>,
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
  unstable_InspectorProxy,
}: Options): DevMiddlewareAPI {
  const experiments = getExperiments(experimentConfig);

  const InspectorProxyClass = unstable_InspectorProxy ?? InspectorProxy;
  const inspectorProxy = new InspectorProxyClass(
    projectRoot,
    serverBaseUrl,
    unstable_eventReporter,
    experiments,
  );

  const middleware = connect()
    .use(
      '/open-debugger',
      experiments.enableNewDebugger
        ? openDebuggerMiddleware({
            serverBaseUrl,
            inspectorProxy,
            browserLauncher: unstable_browserLauncher,
            eventReporter: unstable_eventReporter,
            experiments,
            logger,
          })
        : deprecated_openFlipperMiddleware({
            logger,
          }),
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
    enableNewDebugger: config.enableNewDebugger ?? false,
    enableOpenDebuggerRedirect: config.enableOpenDebuggerRedirect ?? false,
    enableNetworkInspector: config.enableNetworkInspector ?? false,
  };
}

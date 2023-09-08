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

import type {NextHandleFunction} from 'connect';
import type {BrowserLauncher} from './types/BrowserLauncher';
import type {EventReporter} from './types/EventReporter';
import type {Experiments, ExperimentsConfig} from './types/Experiments';
import type {Logger} from './types/Logger';

import reactNativeDebuggerFrontendPath from '@react-native/debugger-frontend';
import connect from 'connect';
import path from 'path';
// $FlowFixMe[untyped-import] TODO: type serve-static
import serveStaticMiddleware from 'serve-static';
import openDebuggerMiddleware from './middleware/openDebuggerMiddleware';
import InspectorProxy from './inspector-proxy/InspectorProxy';
import DefaultBrowserLauncher from './utils/DefaultBrowserLauncher';

type Options = $ReadOnly<{
  host: string,
  port: number,
  projectRoot: string,
  logger?: Logger,
  unstable_browserLauncher?: BrowserLauncher,
  unstable_eventReporter?: EventReporter,
  unstable_experiments?: ExperimentsConfig,
}>;

type DevMiddlewareAPI = $ReadOnly<{
  middleware: NextHandleFunction,
  websocketEndpoints: {[path: string]: ws$WebSocketServer},
}>;

export default function createDevMiddleware({
  host,
  port,
  projectRoot,
  logger,
  unstable_browserLauncher = DefaultBrowserLauncher,
  unstable_eventReporter,
  unstable_experiments: experimentConfig = {},
}: Options): DevMiddlewareAPI {
  const experiments = getExperiments(experimentConfig);

  const inspectorProxy = new InspectorProxy(
    projectRoot,
    unstable_eventReporter,
    experiments,
  );

  const middleware = connect()
    .use(
      '/open-debugger',
      openDebuggerMiddleware({
        logger,
        browserLauncher: unstable_browserLauncher,
        eventReporter: unstable_eventReporter,
        experiments,
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
    websocketEndpoints: inspectorProxy.createWebSocketListeners(
      `${host}:${port}`,
    ),
  };
}

function getExperiments(config: ExperimentsConfig): Experiments {
  return {
    enableCustomDebuggerFrontend: config.enableCustomDebuggerFrontend ?? false,
  };
}

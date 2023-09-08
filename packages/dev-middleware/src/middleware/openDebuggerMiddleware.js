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
import type {IncomingMessage, ServerResponse} from 'http';
import type {BrowserLauncher, LaunchedBrowser} from '../types/BrowserLauncher';
import type {EventReporter} from '../types/EventReporter';
import type {Experiments} from '../types/Experiments';
import type {Logger} from '../types/Logger';

import url from 'url';
import getDevServerUrl from '../utils/getDevServerUrl';
import getDevToolsFrontendUrl from '../utils/getDevToolsFrontendUrl';
import queryInspectorTargets from '../utils/queryInspectorTargets';

const debuggerInstances = new Map<string, ?LaunchedBrowser>();

type Options = $ReadOnly<{
  browserLauncher: BrowserLauncher,
  logger?: Logger,
  eventReporter?: EventReporter,
  experiments: Experiments,
}>;

/**
 * Open the JavaScript debugger for a given CDP target (direct Hermes debugging).
 *
 * Currently supports Hermes targets, opening debugger websocket URL in Chrome
 * DevTools.
 *
 * @see https://chromedevtools.github.io/devtools-protocol/
 */
export default function openDebuggerMiddleware({
  browserLauncher,
  eventReporter,
  experiments,
  logger,
}: Options): NextHandleFunction {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: Error) => void,
  ) => {
    if (req.method === 'POST') {
      const {query} = url.parse(req.url, true);
      const {appId} = query;

      const targets = await queryInspectorTargets(
        getDevServerUrl(req, 'local'),
      );
      let target;

      if (typeof appId === 'string') {
        logger?.info('Launching JS debugger...');
        target = targets.find(_target => _target.description === appId);
      } else {
        logger?.info('Launching JS debugger for first available target...');
        target = targets[0];
      }

      if (!target) {
        res.writeHead(404);
        res.end('Unable to find Chrome DevTools inspector target');
        logger?.warn(
          'No compatible apps connected. JavaScript debugging can only be used with the Hermes engine.',
        );
        eventReporter?.logEvent({
          type: 'launch_debugger_frontend',
          status: 'coded_error',
          errorCode: 'NO_APPS_FOUND',
        });
        return;
      }

      try {
        await debuggerInstances.get(appId)?.kill();
        debuggerInstances.set(
          appId,
          await browserLauncher.launchDebuggerAppWindow(
            getDevToolsFrontendUrl(
              target.webSocketDebuggerUrl,
              getDevServerUrl(req, 'public'),
              experiments,
            ),
          ),
        );
        res.end();
        eventReporter?.logEvent({
          type: 'launch_debugger_frontend',
          status: 'success',
          appId,
        });
        return;
      } catch (e) {
        logger?.error(
          'Error launching JS debugger: ' + e.message ?? 'Unknown error',
        );
        res.writeHead(500);
        res.end();
        eventReporter?.logEvent({
          type: 'launch_debugger_frontend',
          status: 'error',
          error: e,
        });
        return;
      }
    }

    next();
  };
}

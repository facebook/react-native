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

import type {LaunchedChrome} from 'chrome-launcher';
import type {NextHandleFunction} from 'connect';
import type {IncomingMessage, ServerResponse} from 'http';
import type {Logger} from '../types/Logger';

import url from 'url';
import getDevServerUrl from '../utils/getDevServerUrl';
import launchChromeDevTools from '../utils/launchChromeDevTools';
import queryInspectorTargets from '../utils/queryInspectorTargets';

const debuggerInstances = new Map<string, LaunchedChrome>();

type Options = $ReadOnly<{
  logger?: Logger,
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

      if (typeof appId !== 'string') {
        res.writeHead(400);
        res.end();
        return;
      }

      const targets = await queryInspectorTargets(getDevServerUrl(req));
      const target = targets.find(_target => _target.description === appId);

      if (!target) {
        res.writeHead(404);
        res.end('Unable to find Chrome DevTools inspector target');
        logger?.warn(
          'No compatible apps connected. JavaScript debugging can only be used with the Hermes engine.',
        );
        return;
      }

      try {
        logger?.info('Launching JS debugger...');
        debuggerInstances.get(appId)?.kill();
        debuggerInstances.set(
          appId,
          await launchChromeDevTools(target.webSocketDebuggerUrl),
        );
        res.end();
        return;
      } catch (e) {
        logger?.error(
          'Error launching JS debugger: ' + e.message ?? 'Unknown error',
        );
        res.writeHead(500);
        res.end();
        return;
      }
    }

    next();
  };
}

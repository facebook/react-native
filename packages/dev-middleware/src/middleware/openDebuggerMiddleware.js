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
import type {InspectorProxyQueries} from '../inspector-proxy/InspectorProxy';
import type {BrowserLauncher, LaunchedBrowser} from '../types/BrowserLauncher';
import type {EventReporter} from '../types/EventReporter';
import type {Experiments} from '../types/Experiments';
import type {Logger} from '../types/Logger';

import url from 'url';
import getDevToolsFrontendUrl from '../utils/getDevToolsFrontendUrl';

const debuggerInstances = new Map<string, ?LaunchedBrowser>();

type Options = $ReadOnly<{
  serverBaseUrl: string,
  logger?: Logger,
  browserLauncher: BrowserLauncher,
  eventReporter?: EventReporter,
  experiments: Experiments,
  inspectorProxy: InspectorProxyQueries,
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
  serverBaseUrl,
  logger,
  browserLauncher,
  eventReporter,
  experiments,
  inspectorProxy,
}: Options): NextHandleFunction {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: Error) => void,
  ) => {
    if (
      req.method === 'POST' ||
      (experiments.enableOpenDebuggerRedirect && req.method === 'GET')
    ) {
      const {query} = url.parse(req.url, true);
      const {appId, device}: {appId?: string, device?: string, ...} = query;

      const targets = inspectorProxy.getPageDescriptions().filter(
        // Only use targets with better reloading support
        app =>
          app.title === 'React Native Experimental (Improved Chrome Reloads)',
      );
      let target;

      const launchType: 'launch' | 'redirect' =
        req.method === 'POST' ? 'launch' : 'redirect';

      if (typeof appId === 'string' || typeof device === 'string') {
        logger?.info(
          (launchType === 'launch' ? 'Launching' : 'Redirecting to') +
            ' JS debugger (experimental)...',
        );
        if (typeof device === 'string') {
          target = targets.find(
            _target => _target.reactNative.logicalDeviceId === device,
          );
        }
        if (!target && typeof appId === 'string') {
          target = targets.find(_target => _target.description === appId);
        }
      } else {
        logger?.info(
          (launchType === 'launch' ? 'Launching' : 'Redirecting to') +
            ' JS debugger for first available target...',
        );
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
          launchType,
          status: 'coded_error',
          errorCode: 'NO_APPS_FOUND',
        });
        return;
      }

      try {
        switch (launchType) {
          case 'launch':
            const frontendInstanceId =
              device != null
                ? 'device:' + device
                : 'app:' + (appId ?? '<null>');
            await debuggerInstances.get(frontendInstanceId)?.kill();
            debuggerInstances.set(
              frontendInstanceId,
              await browserLauncher.launchDebuggerAppWindow(
                getDevToolsFrontendUrl(
                  target.webSocketDebuggerUrl,
                  serverBaseUrl,
                ),
              ),
            );
            res.end();
            break;
          case 'redirect':
            res.writeHead(302, {
              Location: getDevToolsFrontendUrl(
                target.webSocketDebuggerUrl,
                // Use a relative URL.
                '',
              ),
            });
            res.end();
            break;
          default:
            (launchType: empty);
        }
        eventReporter?.logEvent({
          type: 'launch_debugger_frontend',
          launchType,
          status: 'success',
          appId: appId ?? null,
          deviceId: device ?? null,
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
          launchType,
          status: 'error',
          error: e,
        });
        return;
      }
    }

    next();
  };
}

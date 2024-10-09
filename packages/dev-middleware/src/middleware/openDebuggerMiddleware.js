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

import type {InspectorProxyQueries} from '../inspector-proxy/InspectorProxy';
import type {BrowserLauncher} from '../types/BrowserLauncher';
import type {EventReporter} from '../types/EventReporter';
import type {Experiments} from '../types/Experiments';
import type {Logger} from '../types/Logger';
import type {NextHandleFunction} from 'connect';
import type {IncomingMessage, ServerResponse} from 'http';

import getDevToolsFrontendUrl from '../utils/getDevToolsFrontendUrl';
import url from 'url';

type Options = $ReadOnly<{
  serverBaseUrl: string,
  logger?: Logger,
  browserLauncher: BrowserLauncher,
  eventReporter?: EventReporter,
  experiments: Experiments,
  inspectorProxy: InspectorProxyQueries,
}>;

/**
 * Open the debugger frontend for a given CDP target.
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
      const {
        appId,
        device,
        launchId,
        target: targetId,
      }: {
        appId?: string,
        device?: string,
        launchId?: string,
        target?: string,
        ...
      } = query;

      const targets = inspectorProxy.getPageDescriptions().filter(
        // Only use targets with better reloading support
        app =>
          app.title === 'React Native Experimental (Improved Chrome Reloads)' ||
          app.reactNative.capabilities?.nativePageReloads === true,
      );

      let target;

      const launchType: 'launch' | 'redirect' =
        req.method === 'POST' ? 'launch' : 'redirect';

      if (
        typeof targetId === 'string' ||
        typeof appId === 'string' ||
        typeof device === 'string'
      ) {
        logger?.info(
          (launchType === 'launch' ? 'Launching' : 'Redirecting to') +
            ' DevTools...',
        );
        target = targets.find(
          _target =>
            (targetId == null || _target.id === targetId) &&
            (appId == null || _target.description === appId) &&
            (device == null || _target.reactNative.logicalDeviceId === device),
        );
      } else if (targets.length > 0) {
        logger?.info(
          (launchType === 'launch' ? 'Launching' : 'Redirecting to') +
            ` DevTools${targets.length === 1 ? '' : ' for most recently connected target'}...`,
        );
        target = targets[targets.length - 1];
      }

      if (!target) {
        res.writeHead(404);
        res.end('Unable to find debugger target');
        logger?.warn(
          'No compatible apps connected. React Native DevTools can only be used with the Hermes engine.',
        );
        eventReporter?.logEvent({
          type: 'launch_debugger_frontend',
          launchType,
          status: 'coded_error',
          errorCode: 'NO_APPS_FOUND',
        });
        return;
      }

      const useFuseboxEntryPoint =
        target.reactNative.capabilities?.prefersFuseboxFrontend;

      try {
        switch (launchType) {
          case 'launch':
            await browserLauncher.launchDebuggerAppWindow(
              getDevToolsFrontendUrl(
                experiments,
                target.webSocketDebuggerUrl,
                serverBaseUrl,
                {launchId, useFuseboxEntryPoint},
              ),
            );
            res.writeHead(200);
            res.end();
            break;
          case 'redirect':
            res.writeHead(302, {
              Location: getDevToolsFrontendUrl(
                experiments,
                target.webSocketDebuggerUrl,
                serverBaseUrl,
                {relative: true, launchId, useFuseboxEntryPoint},
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
          resolvedTargetDescription: target.description,
          prefersFuseboxFrontend: useFuseboxEntryPoint ?? false,
        });
        return;
      } catch (e) {
        logger?.error(
          'Error launching DevTools: ' + e.message ?? 'Unknown error',
        );
        res.writeHead(500);
        res.end();
        eventReporter?.logEvent({
          type: 'launch_debugger_frontend',
          launchType,
          status: 'error',
          error: e,
          prefersFuseboxFrontend: useFuseboxEntryPoint ?? false,
        });
        return;
      }
    }

    next();
  };
}

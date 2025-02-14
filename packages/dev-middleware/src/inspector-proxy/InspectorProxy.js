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

import type {EventReporter} from '../types/EventReporter';
import type {Experiments} from '../types/Experiments';
import type {Logger} from '../types/Logger';
import type {CreateCustomMessageHandlerFn} from './CustomMessageHandler';
import type {DeviceOptions} from './Device';
import type {
  JsonPagesListResponse,
  JsonVersionResponse,
  Page,
  PageDescription,
} from './types';
import type {IncomingMessage, ServerResponse} from 'http';
// $FlowFixMe[cannot-resolve-module] libdef missing in RN OSS
import type {Timeout} from 'timers';

import getBaseUrlFromRequest from '../utils/getBaseUrlFromRequest';
import Device from './Device';
import nullthrows from 'nullthrows';
// Import these from node:timers to get the correct Flow types.
// $FlowFixMe[cannot-resolve-module] libdef missing in RN OSS
import {clearTimeout, setTimeout} from 'timers';
import url from 'url';
import WS from 'ws';

const debug = require('debug')('Metro:InspectorProxy');

const WS_DEVICE_URL = '/inspector/device';
const WS_DEBUGGER_URL = '/inspector/debug';
const PAGES_LIST_JSON_URL = '/json';
const PAGES_LIST_JSON_URL_2 = '/json/list';
const PAGES_LIST_JSON_VERSION_URL = '/json/version';
const MAX_PONG_LATENCY_MS = 60000;
const DEBUGGER_HEARTBEAT_INTERVAL_MS = 10000;

const INTERNAL_ERROR_CODE = 1011;

export interface InspectorProxyQueries {
  /**
   * Returns list of page descriptions ordered by device connection order, then
   * page addition order.
   */
  getPageDescriptions(requestorRelativeBaseUrl: URL): Array<PageDescription>;
}

/**
 * Main Inspector Proxy class that connects JavaScript VM inside Android/iOS apps and JS debugger.
 */
export default class InspectorProxy implements InspectorProxyQueries {
  // Root of the project used for relative to absolute source path conversion.
  #projectRoot: string;

  // The base URL to the dev server from the dev-middleware host.
  #serverBaseUrl: URL;

  // Maps device ID to Device instance.
  #devices: Map<string, Device>;

  // Internal counter for device IDs -- just gets incremented for each new device.
  #deviceCounter: number = 0;

  #eventReporter: ?EventReporter;

  #experiments: Experiments;

  // custom message handler factory allowing implementers to handle unsupported CDP messages.
  #customMessageHandler: ?CreateCustomMessageHandlerFn;

  #logger: ?Logger;

  constructor(
    projectRoot: string,
    serverBaseUrl: string,
    eventReporter: ?EventReporter,
    experiments: Experiments,
    logger?: Logger,
    customMessageHandler: ?CreateCustomMessageHandlerFn,
  ) {
    this.#projectRoot = projectRoot;
    this.#serverBaseUrl = new URL(serverBaseUrl);
    this.#devices = new Map();
    this.#eventReporter = eventReporter;
    this.#experiments = experiments;
    this.#logger = logger;
    this.#customMessageHandler = customMessageHandler;
  }

  getPageDescriptions(requestorRelativeBaseUrl: URL): Array<PageDescription> {
    // Build list of pages from all devices.
    let result: Array<PageDescription> = [];
    Array.from(this.#devices.entries()).forEach(([deviceId, device]) => {
      result = result.concat(
        device
          .getPagesList()
          .map((page: Page) =>
            this.#buildPageDescription(
              deviceId,
              device,
              page,
              requestorRelativeBaseUrl,
            ),
          ),
      );
    });
    return result;
  }

  // Process HTTP request sent to server. We only respond to 2 HTTP requests:
  // 1. /json/version returns Chrome debugger protocol version that we use
  // 2. /json and /json/list returns list of page descriptions (list of inspectable apps).
  // This list is combined from all the connected devices.
  processRequest(
    request: IncomingMessage,
    response: ServerResponse,
    next: (?Error) => mixed,
  ) {
    const pathname = url.parse(request.url).pathname;
    if (
      pathname === PAGES_LIST_JSON_URL ||
      pathname === PAGES_LIST_JSON_URL_2
    ) {
      this.#sendJsonResponse(
        response,
        this.getPageDescriptions(
          getBaseUrlFromRequest(request) ?? this.#serverBaseUrl,
        ),
      );
    } else if (pathname === PAGES_LIST_JSON_VERSION_URL) {
      this.#sendJsonResponse(response, {
        Browser: 'Mobile JavaScript',
        'Protocol-Version': '1.1',
      });
    } else {
      next();
    }
  }

  createWebSocketListeners(): {
    [path: string]: WS.Server,
  } {
    return {
      [WS_DEVICE_URL]: this.#createDeviceConnectionWSServer(),
      [WS_DEBUGGER_URL]: this.#createDebuggerConnectionWSServer(),
    };
  }

  // Converts page information received from device into PageDescription object
  // that is sent to debugger.
  #buildPageDescription(
    deviceId: string,
    device: Device,
    page: Page,
    requestorRelativeBaseUrl: URL,
  ): PageDescription {
    const {host, protocol} = requestorRelativeBaseUrl;
    const webSocketScheme = protocol === 'https:' ? 'wss' : 'ws';

    const webSocketUrlWithoutProtocol = `${host}${WS_DEBUGGER_URL}?device=${deviceId}&page=${page.id}`;
    const webSocketDebuggerUrl = `${webSocketScheme}://${webSocketUrlWithoutProtocol}`;

    // For now, `/json/list` returns the legacy built-in `devtools://` URL, to
    // preserve existing handling by Flipper. This may return a placeholder in
    // future -- please use the `/open-debugger` endpoint.
    const devtoolsFrontendUrl =
      `devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&${webSocketScheme}=` +
      encodeURIComponent(webSocketUrlWithoutProtocol);

    return {
      id: `${deviceId}-${page.id}`,
      title: page.title,
      description: page.description ?? page.app,
      appId: page.app,
      type: 'node',
      devtoolsFrontendUrl,
      webSocketDebuggerUrl,
      ...(page.vm != null ? {vm: page.vm} : null),
      deviceName: device.getName(),
      reactNative: {
        logicalDeviceId: deviceId,
        capabilities: nullthrows(page.capabilities),
      },
    };
  }

  // Sends object as response to HTTP request.
  // Just serializes object using JSON and sets required headers.
  #sendJsonResponse(
    response: ServerResponse,
    object: JsonPagesListResponse | JsonVersionResponse,
  ) {
    const data = JSON.stringify(object, null, 2);
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=UTF-8',
      'Cache-Control': 'no-cache',
      'Content-Length': Buffer.byteLength(data).toString(),
      Connection: 'close',
    });
    response.end(data);
  }

  // Adds websocket handler for device connections.
  // Device connects to /inspector/device and passes device and app names as
  // HTTP GET params.
  // For each new websocket connection we parse device and app names and create
  // new instance of Device class.
  #createDeviceConnectionWSServer(): ws$WebSocketServer {
    const wss = new WS.Server({
      noServer: true,
      perMessageDeflate: true,
      // Don't crash on exceptionally large messages - assume the device is
      // well-behaved and the debugger is prepared to handle large messages.
      maxPayload: 0,
    });
    // $FlowFixMe[value-as-type]
    wss.on('connection', async (socket: WS, req) => {
      const fallbackDeviceId = String(this.#deviceCounter++);

      const query = url.parse(req.url || '', true).query || {};
      const deviceId = query.device || fallbackDeviceId;
      const deviceName = query.name || 'Unknown';
      const appName = query.app || 'Unknown';
      const isProfilingBuild = query.profiling === 'true';

      try {
        const deviceRelativeBaseUrl =
          getBaseUrlFromRequest(req) ?? this.#serverBaseUrl;

        const oldDevice = this.#devices.get(deviceId);

        let newDevice;
        const deviceOptions: DeviceOptions = {
          id: deviceId,
          name: deviceName,
          app: appName,
          socket,
          projectRoot: this.#projectRoot,
          eventReporter: this.#eventReporter,
          createMessageMiddleware: this.#customMessageHandler,
          deviceRelativeBaseUrl,
          serverRelativeBaseUrl: this.#serverBaseUrl,
          isProfilingBuild,
        };

        if (oldDevice) {
          oldDevice.dangerouslyRecreateDevice(deviceOptions);
          newDevice = oldDevice;
        } else {
          newDevice = new Device(deviceOptions);
        }

        this.#devices.set(deviceId, newDevice);

        this.#logger?.info(
          "Connection established to app '%s' on device '%s'.",
          appName,
          deviceName,
        );

        debug(
          `Got new connection: name=${deviceName}, app=${appName}, device=${deviceId}, via=${deviceRelativeBaseUrl.origin}`,
        );

        socket.on('close', (code: number, reason: string) => {
          this.#logger?.info(
            "Connection closed to app '%s' on device '%s' with code '%s' and reason '%s'.",
            appName,
            deviceName,
            String(code),
            reason,
          );

          if (this.#devices.get(deviceId)?.dangerouslyGetSocket() === socket) {
            this.#devices.delete(deviceId);
          }
        });
      } catch (error) {
        this.#logger?.error(
          "Connection failed to be established with app '%s' on device '%s' with error:",
          appName,
          deviceName,
          error,
        );
        socket.close(INTERNAL_ERROR_CODE, error?.toString() ?? 'Unknown error');
      }
    });
    return wss;
  }

  // Returns websocket handler for debugger connections.
  // Debugger connects to webSocketDebuggerUrl that we return as part of page description
  // in /json response.
  // When debugger connects we try to parse device and page IDs from the query and pass
  // websocket object to corresponding Device instance.
  #createDebuggerConnectionWSServer(): ws$WebSocketServer {
    const wss = new WS.Server({
      noServer: true,
      perMessageDeflate: false,
      // Don't crash on exceptionally large messages - assume the debugger is
      // well-behaved and the device is prepared to handle large messages.
      maxPayload: 0,
    });
    // $FlowFixMe[value-as-type]
    wss.on('connection', async (socket: WS, req) => {
      try {
        const query = url.parse(req.url || '', true).query || {};
        const deviceId = query.device;
        const pageId = query.page;
        const debuggerRelativeBaseUrl =
          getBaseUrlFromRequest(req) ?? this.#serverBaseUrl;
        const appId = this.#devices.get(deviceId)?.getApp() || 'unknown';

        if (deviceId == null || pageId == null) {
          throw new Error('Incorrect URL - must provide device and page IDs');
        }

        const device = this.#devices.get(deviceId);
        if (device == null) {
          throw new Error('Unknown device with ID ' + deviceId);
        }

        this.#logger?.info('Connection to DevTools established.');

        this.#startHeartbeat(socket, DEBUGGER_HEARTBEAT_INTERVAL_MS, appId);

        device.handleDebuggerConnection(socket, pageId, {
          debuggerRelativeBaseUrl,
          userAgent: req.headers['user-agent'] ?? query.userAgent ?? null,
        });
      } catch (error) {
        this.#logger?.error(
          'Connection failed to be established with DevTools with error:',
          error,
        );
        socket.close(INTERNAL_ERROR_CODE, error?.toString() ?? 'Unknown error');
        this.#eventReporter?.logEvent({
          type: 'connect_debugger_frontend',
          status: 'error',
          error,
        });
      }
    });
    return wss;
  }

  // Starts pinging the socket at the given interval. Compliant clients will
  // respond with pong frame. This serves both to detect when the client
  // has gone away without sending a close frame, and as a keepalive in cases
  // where proxies may drop idle connections (e.g., VS Code tunnels).
  //
  // https://datatracker.ietf.org/doc/html/rfc6455#section-5.5.2
  #startHeartbeat(socket: WS, intervalMs: number, appId: string) {
    let shouldSetTerminateTimeout = false;
    let terminateTimeout = null;
    let latestPingMs = Date.now();

    const pingTimeout: Timeout = setTimeout(() => {
      if (socket.readyState !== WS.OPEN) {
        // May be connecting or closing, try again later.
        pingTimeout.refresh();
        return;
      }

      shouldSetTerminateTimeout = true;
      latestPingMs = Date.now();
      socket.ping(() => {
        if (!shouldSetTerminateTimeout) {
          // Sometimes, this `sent` callback fires later than
          // the actual pong reply.
          //
          // If any message came in between ping `sending` and `sent`,
          // then the connection exists; and we don't need to do anything.
          return;
        }

        shouldSetTerminateTimeout = false;
        terminateTimeout = setTimeout(() => {
          if (socket.readyState !== WS.OPEN) {
            return;
          }
          // We don't use close() here because that initiates a closing handshake,
          // which will not complete if the other end has gone away - 'close'
          // would not be emitted.
          //
          // terminate() emits 'close' immediately, allowing us to handle it and
          // inform any clients.
          socket.terminate();
          this.#logger?.error(
            `Connection terminated with DevTools after not responding for ${MAX_PONG_LATENCY_MS / 1000} seconds.`,
          );
          this.#eventReporter?.logEvent({
            type: 'debugger_timeout',
            duration: MAX_PONG_LATENCY_MS,
            appId,
          });
        }, MAX_PONG_LATENCY_MS).unref();
      });
    }, intervalMs).unref();

    const onAnyMessageFromDebugger = () => {
      shouldSetTerminateTimeout = false;
      terminateTimeout && clearTimeout(terminateTimeout);
      pingTimeout.refresh();
    };

    socket.on('pong', () => {
      onAnyMessageFromDebugger();
      this.#eventReporter?.logEvent({
        type: 'debugger_heartbeat',
        duration: Date.now() - latestPingMs,
        appId,
      });
    });
    socket.on('message', () => {
      onAnyMessageFromDebugger();
    });

    socket.on('close', (code: number, reason: string) => {
      this.#logger?.info(
        "Connection to DevTools closed with code '%s' and reason '%s'.",
        String(code),
        reason,
      );
      shouldSetTerminateTimeout = false;
      terminateTimeout && clearTimeout(terminateTimeout);
      clearTimeout(pingTimeout);
    });
  }
}

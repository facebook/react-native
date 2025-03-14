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

import type {DebuggerSessionIDs, EventReporter} from '../types/EventReporter';
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

import getBaseUrlFromRequest from '../utils/getBaseUrlFromRequest';
import Device from './Device';
import EventLoopPerfTracker from './EventLoopPerfTracker';
import InspectorProxyHeartbeat from './InspectorProxyHeartbeat';
import nullthrows from 'nullthrows';
import url from 'url';
import WS from 'ws';

const debug = require('debug')('Metro:InspectorProxy');

const WS_DEVICE_URL = '/inspector/device';
const WS_DEBUGGER_URL = '/inspector/debug';
const PAGES_LIST_JSON_URL = '/json';
const PAGES_LIST_JSON_URL_2 = '/json/list';
const PAGES_LIST_JSON_VERSION_URL = '/json/version';

const PROXY_IDLE_TIMEOUT_MS = 10000;

const HEARTBEAT_TIME_BETWEEN_PINGS_MS = 5000;
const HEARTBEAT_TIMEOUT_MS = 60000;
const MIN_PING_TO_REPORT = 500;

const EVENT_LOOP_PERF_MEASUREMENT_MS = 5000;
const MIN_EVENT_LOOP_DELAY_PERCENT_TO_REPORT = 20;

const INTERNAL_ERROR_CODE = 1011;

export type GetPageDescriptionsConfig = {
  requestorRelativeBaseUrl: URL,
  logNoPagesForConnectedDevice?: boolean,
};

export interface InspectorProxyQueries {
  /**
   * Returns list of page descriptions ordered by device connection order, then
   * page addition order.
   */
  getPageDescriptions(
    config: GetPageDescriptionsConfig,
  ): Array<PageDescription>;
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

  #lastMessageTimestamp: number = 0;

  #eventLoopPerfTracker: EventLoopPerfTracker;

  constructor(
    projectRoot: string,
    serverBaseUrl: string,
    eventReporter: ?EventReporter,
    experiments: Experiments,
    logger?: Logger,
    customMessageHandler: ?CreateCustomMessageHandlerFn,
    trackEventLoopPerf?: boolean = false,
  ) {
    this.#projectRoot = projectRoot;
    this.#serverBaseUrl = new URL(serverBaseUrl);
    this.#devices = new Map();
    this.#eventReporter = eventReporter;
    this.#experiments = experiments;
    this.#logger = logger;
    this.#customMessageHandler = customMessageHandler;
    if (trackEventLoopPerf) {
      this.#eventLoopPerfTracker = new EventLoopPerfTracker({
        perfMeasurementDuration: EVENT_LOOP_PERF_MEASUREMENT_MS,
        minDelayPercentToReport: MIN_EVENT_LOOP_DELAY_PERCENT_TO_REPORT,
        onHighDelay: ({
          eventLoopUtilization,
          maxEventLoopDelayPercent,
          duration,
          debuggerSessionIDs,
          connectionUptime,
        }) => {
          debug(
            "[perf] high event loop delay in the last %ds- event loop utilization='%d%' max event loop delay percent='%d%'",
            duration / 1000,
            eventLoopUtilization,
            maxEventLoopDelayPercent,
          );

          this.#eventReporter?.logEvent({
            type: 'high_event_loop_delay',
            eventLoopUtilization,
            maxEventLoopDelayPercent,
            duration,
            connectionUptime,
            ...debuggerSessionIDs,
          });
        },
      });
    }
  }

  getPageDescriptions({
    requestorRelativeBaseUrl,
    logNoPagesForConnectedDevice = false,
  }: GetPageDescriptionsConfig): Array<PageDescription> {
    // Build list of pages from all devices.
    let result: Array<PageDescription> = [];
    Array.from(this.#devices.entries()).forEach(([deviceId, device]) => {
      const devicePages = device
        .getPagesList()
        .map((page: Page) =>
          this.#buildPageDescription(
            deviceId,
            device,
            page,
            requestorRelativeBaseUrl,
          ),
        );

      if (
        logNoPagesForConnectedDevice &&
        devicePages.length === 0 &&
        device.dangerouslyGetSocket()?.readyState === WS.OPEN
      ) {
        this.#logger?.warn(
          `Waiting for a DevTools connection to app='%s' on device='%s'.
    Try again when it's established. If no connection occurs, try to:
    - Restart the app
    - Ensure a stable connection to the device
    - Ensure that the app is built in a mode that supports debugging`,
          device.getApp(),
          device.getName(),
        );
      }

      result = result.concat(devicePages);
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
        this.getPageDescriptions({
          requestorRelativeBaseUrl:
            getBaseUrlFromRequest(request) ?? this.#serverBaseUrl,
          logNoPagesForConnectedDevice: true,
        }),
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

  /* returns true if proxy didn't receive any messages from
   * either the device or debugger for PROXY_IDLE_TIMEOUT_MS */
  #isIdle(): boolean {
    return Date.now() - this.#lastMessageTimestamp > PROXY_IDLE_TIMEOUT_MS;
  }

  #onMessageFromDeviceOrDebugger(
    message: string,
    debuggerSessionIDs: DebuggerSessionIDs,
    connectionUptime: number,
  ): void {
    // TODO: instead remove this and any other messages in idle state we find
    // Not using JSON.parse for performance reasons. Worst case, we'll get
    // less accurate idle state reporting, which we would easily see in data.
    if (message.includes('"event":"getPages"')) {
      return;
    }

    this.#lastMessageTimestamp = Date.now();

    this.#eventLoopPerfTracker?.trackPerfThrottled(
      debuggerSessionIDs,
      connectionUptime,
    );
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
      const wssTimestamp = Date.now();

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
          "Connection established to app='%s' on device='%s'.",
          appName,
          deviceName,
        );

        debug(
          "Got new device connection: name='%s', app=%s, device=%s, via=%s",
          deviceName,
          appName,
          deviceId,
          deviceRelativeBaseUrl.origin,
        );

        const debuggerSessionIDs: DebuggerSessionIDs = {
          appId: newDevice?.getApp() || null,
          deviceId,
          deviceName: newDevice?.getName() || null,
          pageId: null,
        };

        const heartbeat = new InspectorProxyHeartbeat({
          socket,
          timeBetweenPings: HEARTBEAT_TIME_BETWEEN_PINGS_MS,
          minHighPingToReport: MIN_PING_TO_REPORT,
          timeoutMs: HEARTBEAT_TIMEOUT_MS,
          onHighPing: roundtripDuration => {
            const isIdle = this.#isIdle();

            debug(
              "[high ping] [ Device ] %sms for app='%s' on device='%s' with idle='%s'",
              String(roundtripDuration).padStart(5),
              debuggerSessionIDs.appId,
              debuggerSessionIDs.deviceName,
              isIdle ? 'true' : 'false',
            );

            this.#eventReporter?.logEvent({
              type: 'device_high_ping',
              duration: roundtripDuration,
              isIdle,
              connectionUptime: Date.now() - wssTimestamp,
              ...debuggerSessionIDs,
            });
          },
          onTimeout: roundtripDuration => {
            // We don't use close() here because that initiates a closing handshake,
            // which will not complete if the other end has gone away - 'close'
            // would not be emitted.
            // terminate() emits 'close' immediately, allowing us to handle it and
            // inform any clients.
            socket.terminate();

            const isIdle = this.#isIdle();

            this.#logger?.error(
              "[timeout] connection terminated with Device for app='%s' on device='%s' with idle='%s' after not responding for %s seconds.",
              debuggerSessionIDs.appId ?? 'unknown',
              debuggerSessionIDs.deviceName ?? 'unknown',
              isIdle ? 'true' : 'false',
              String(roundtripDuration / 1000),
            );

            this.#eventReporter?.logEvent({
              type: 'device_timeout',
              duration: roundtripDuration,
              isIdle,
              connectionUptime: Date.now() - wssTimestamp,
              ...debuggerSessionIDs,
            });
          },
        });

        heartbeat.start();

        socket.on('message', message =>
          this.#onMessageFromDeviceOrDebugger(
            message.toString(),
            debuggerSessionIDs,
            Date.now() - wssTimestamp,
          ),
        );

        socket.on('close', (code: number, reason: string) => {
          this.#logger?.info(
            "Connection closed to device='%s' for app='%s' with code='%s' and reason='%s'.",
            deviceName,
            appName,
            String(code),
            reason,
          );

          this.#eventReporter?.logEvent({
            type: 'device_connection_closed',
            code,
            reason,
            isIdle: this.#isIdle(),
            connectionUptime: Date.now() - wssTimestamp,
            ...debuggerSessionIDs,
          });

          if (this.#devices.get(deviceId)?.dangerouslyGetSocket() === socket) {
            this.#devices.delete(deviceId);
          }
        });
      } catch (error) {
        this.#logger?.error(
          "Connection failed to be established with app='%s' on device='%s' with error:",
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
      const wssTimestamp = Date.now();

      const query = url.parse(req.url || '', true).query || {};
      const deviceId = query.device;
      const pageId = query.page;
      const debuggerRelativeBaseUrl =
        getBaseUrlFromRequest(req) ?? this.#serverBaseUrl;
      const device: Device | void = deviceId
        ? this.#devices.get(deviceId)
        : undefined;

      const debuggerSessionIDs: DebuggerSessionIDs = {
        appId: device?.getApp() || null,
        deviceId,
        deviceName: device?.getName() || null,
        pageId,
      };

      try {
        if (deviceId == null || pageId == null) {
          throw new Error('Incorrect URL - must provide device and page IDs');
        }

        if (device == null) {
          throw new Error('Unknown device with ID ' + deviceId);
        }

        this.#logger?.info(
          "Connection established to DevTools for app='%s' on device='%s'.",
          device.getApp() || 'unknown',
          device.getName() || 'unknown',
        );

        const heartbeat = new InspectorProxyHeartbeat({
          socket,
          timeBetweenPings: HEARTBEAT_TIME_BETWEEN_PINGS_MS,
          minHighPingToReport: MIN_PING_TO_REPORT,
          timeoutMs: HEARTBEAT_TIMEOUT_MS,
          onHighPing: roundtripDuration => {
            const isIdle = this.#isIdle();

            debug(
              "[high ping] [DevTools] %sms for app='%s' on device='%s' with idle='%s'",
              String(roundtripDuration).padStart(5),
              debuggerSessionIDs.appId,
              debuggerSessionIDs.deviceName,
              isIdle ? 'true' : 'false',
            );

            this.#eventReporter?.logEvent({
              type: 'debugger_high_ping',
              duration: roundtripDuration,
              isIdle,
              connectionUptime: Date.now() - wssTimestamp,
              ...debuggerSessionIDs,
            });
          },
          onTimeout: roundtripDuration => {
            // We don't use close() here because that initiates a closing handshake,
            // which will not complete if the other end has gone away - 'close'
            // would not be emitted.
            // terminate() emits 'close' immediately, allowing us to handle it and
            // inform any clients.
            socket.terminate();

            const isIdle = this.#isIdle();

            this.#logger?.error(
              "[timeout] connection terminated with DevTools for app='%s' on device='%s' with idle='%s' after not responding for %s seconds.",
              debuggerSessionIDs.appId ?? 'unknown',
              debuggerSessionIDs.deviceName ?? 'unknown',
              isIdle ? 'true' : 'false',
              String(roundtripDuration / 1000),
            );

            this.#eventReporter?.logEvent({
              type: 'debugger_timeout',
              duration: roundtripDuration,
              isIdle,
              connectionUptime: Date.now() - wssTimestamp,
              ...debuggerSessionIDs,
            });
          },
        });

        heartbeat.start();

        socket.on('message', message =>
          this.#onMessageFromDeviceOrDebugger(
            message.toString(),
            debuggerSessionIDs,
            Date.now() - wssTimestamp,
          ),
        );

        device.handleDebuggerConnection(socket, pageId, {
          debuggerRelativeBaseUrl,
          userAgent: req.headers['user-agent'] ?? query.userAgent ?? null,
        });

        socket.on('close', (code: number, reason: string) => {
          this.#logger?.info(
            "Connection closed to DevTools for app='%s' on device='%s' with code='%s' and reason='%s'.",
            device.getApp() || 'unknown',
            device.getName() || 'unknown',
            String(code),
            reason,
          );

          this.#eventReporter?.logEvent({
            type: 'debugger_connection_closed',
            code,
            reason,
            isIdle: this.#isIdle(),
            connectionUptime: Date.now() - wssTimestamp,
            ...debuggerSessionIDs,
          });
        });
      } catch (error) {
        this.#logger?.error(
          "Connection failed to be established with DevTools for app='%s' on device='%s' with error:",
          device?.getApp() || 'unknown',
          device?.getName() || 'unknown',
          error,
        );
        socket.close(INTERNAL_ERROR_CODE, error?.toString() ?? 'Unknown error');
        this.#eventReporter?.logEvent({
          type: 'connect_debugger_frontend',
          status: 'error',
          error,
          ...debuggerSessionIDs,
        });
      }
    });
    return wss;
  }
}

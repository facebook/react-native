/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventReporter} from '../types/EventReporter';
import type {
  CDPClientMessage,
  CDPRequest,
  CDPResponse,
  CDPServerMessage,
} from './cdp-types/messages';
import type {
  CreateCustomMessageHandlerFn,
  CustomMessageHandler,
} from './CustomMessageHandler';
import type {
  MessageFromDevice,
  MessageToDevice,
  Page,
  TargetCapabilityFlags,
} from './types';

import CdpDebugLogging from './CdpDebugLogging';
import DeviceEventReporter from './DeviceEventReporter';
import * as fs from 'fs';
import invariant from 'invariant';
import * as path from 'path';
import WS from 'ws';

const debug = require('debug')('Metro:InspectorProxy');

const PAGES_POLLING_INTERVAL = 1000;

const WS_CLOSURE_CODE = {
  NORMAL: 1000,
  INTERNAL_ERROR: 1011,
};

// should be aligned with
// https://github.com/facebook/react-native-devtools-frontend/blob/3d17e0fd462dc698db34586697cce2371b25e0d3/front_end/ui/legacy/components/utils/TargetDetachedDialog.ts#L50-L64
export const WS_CLOSE_REASON = {
  PAGE_NOT_FOUND: '[PAGE_NOT_FOUND] Debugger page not found',
  CONNECTION_LOST: '[CONNECTION_LOST] Connection lost to corresponding device',
  RECREATING_DEVICE: '[RECREATING_DEVICE] Recreating device connection',
  NEW_DEBUGGER_OPENED:
    '[NEW_DEBUGGER_OPENED] New debugger opened for the same app instance',
};

// Prefix for script URLs that are alphanumeric IDs. See comment in #processMessageFromDeviceLegacy method for
// more details.
const FILE_PREFIX = 'file://';

let fuseboxConsoleNoticeLogged = false;

type DebuggerConnection = {
  // Debugger web socket connection
  socket: WS,
  prependedFilePrefix: boolean,
  pageId: string,
  userAgent: string | null,
  customHandler: ?CustomMessageHandler,
  debuggerRelativeBaseUrl: URL,
};

const REACT_NATIVE_RELOADABLE_PAGE_ID = '-1';

export type DeviceOptions = $ReadOnly<{
  id: string,
  name: string,
  app: string,
  socket: WS,
  projectRoot: string,
  eventReporter: ?EventReporter,
  createMessageMiddleware: ?CreateCustomMessageHandlerFn,
  deviceRelativeBaseUrl: URL,
  serverRelativeBaseUrl: URL,
  isProfilingBuild: boolean,
}>;

/**
 * Device class represents single device connection to Inspector Proxy. Each device
 * can have multiple inspectable pages.
 */
export default class Device {
  // ID of the device.
  #id: string;

  // Name of the device.
  #name: string;

  // Package name of the app.
  #app: string;

  // Stores socket connection between Inspector Proxy and device.
  #deviceSocket: WS;

  // Stores the most recent listing of device's pages, keyed by the `id` field.
  #pages: $ReadOnlyMap<string, Page> = new Map();

  // Stores information about currently connected debugger (if any).
  #debuggerConnection: ?DebuggerConnection = null;

  // Last known Page ID of the React Native page.
  // This is used by debugger connections that don't have PageID specified
  // (and will interact with the latest React Native page).
  #lastConnectedLegacyReactNativePage: ?Page = null;

  // Whether we are in the middle of a reload in the REACT_NATIVE_RELOADABLE_PAGE.
  #isLegacyPageReloading: boolean = false;

  // The previous "GetPages" message, for deduplication in debug logs.
  #lastGetPagesMessage: string = '';

  // Mapping built from scriptParsed events and used to fetch file content in `Debugger.getScriptSource`.
  #scriptIdToSourcePathMapping: Map<string, string> = new Map();

  // Root of the project used for relative to absolute source path conversion.
  #projectRoot: string;

  #deviceEventReporter: ?DeviceEventReporter;

  #pagesPollingIntervalId: ReturnType<typeof setInterval>;

  // The device message middleware factory function allowing implementers to handle unsupported CDP messages.
  #createCustomMessageHandler: ?CreateCustomMessageHandlerFn;

  #connectedPageIds: Set<string> = new Set();

  // A base HTTP(S) URL to this server, reachable from the device. Derived from
  // the http request that created the connection.
  #deviceRelativeBaseUrl: URL;

  // A base HTTP(S) URL to the server, relative to this server.
  #serverRelativeBaseUrl: URL;

  // Logging reporting batches of cdp messages
  #cdpDebugLogging: CdpDebugLogging;

  constructor(deviceOptions: DeviceOptions) {
    this.#dangerouslyConstruct(deviceOptions);
  }

  #dangerouslyConstruct({
    id,
    name,
    app,
    socket,
    projectRoot,
    eventReporter,
    createMessageMiddleware,
    serverRelativeBaseUrl,
    deviceRelativeBaseUrl,
    isProfilingBuild,
  }: DeviceOptions) {
    this.#cdpDebugLogging = new CdpDebugLogging();
    this.#id = id;
    this.#name = name;
    this.#app = app;
    this.#deviceSocket = socket;
    this.#projectRoot = projectRoot;
    this.#serverRelativeBaseUrl = serverRelativeBaseUrl;
    this.#deviceRelativeBaseUrl = deviceRelativeBaseUrl;
    this.#deviceEventReporter = eventReporter
      ? new DeviceEventReporter(eventReporter, {
          deviceId: id,
          deviceName: name,
          appId: app,
        })
      : null;
    this.#createCustomMessageHandler = createMessageMiddleware;

    if (isProfilingBuild) {
      this.#deviceEventReporter?.logProfilingTargetRegistered();
    }

    // $FlowFixMe[incompatible-call]
    this.#deviceSocket.on('message', (message: string) => {
      try {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.event === 'getPages') {
          // There's a 'getPages' message every second, so only show them if they change
          if (message !== this.#lastGetPagesMessage) {
            debug('Device getPages ping has changed: %s', message);
            this.#lastGetPagesMessage = message;
          }
        } else {
          this.#cdpDebugLogging.log('DeviceToProxy', message);
        }
        this.#handleMessageFromDevice(parsedMessage);
      } catch (error) {
        debug('%O\nHandling device message: %s', error, message);
        try {
          this.#deviceEventReporter?.logProxyMessageHandlingError(
            'device',
            error,
            message,
          );
        } catch (loggingError) {
          debug(
            'Error logging message handling error to reporter: %O',
            loggingError,
          );
        }
      }
    });

    // Sends 'getPages' request to device every PAGES_POLLING_INTERVAL milliseconds.
    this.#pagesPollingIntervalId = setInterval(
      () => this.#sendMessageToDevice({event: 'getPages'}),
      PAGES_POLLING_INTERVAL,
    );
    this.#deviceSocket.on('close', () => {
      if (socket === this.#deviceSocket) {
        this.#deviceEventReporter?.logDisconnection('device');
        // Device disconnected - close debugger connection.
        this.#terminateDebuggerConnection(
          WS_CLOSURE_CODE.NORMAL,
          WS_CLOSE_REASON.CONNECTION_LOST,
        );
        clearInterval(this.#pagesPollingIntervalId);
      }
    });
  }

  #terminateDebuggerConnection(code?: number, reason?: string) {
    const debuggerConnection = this.#debuggerConnection;
    if (debuggerConnection) {
      this.#sendDisconnectEventToDevice(
        this.#mapToDevicePageId(debuggerConnection.pageId),
      );
      debuggerConnection.socket.close(code, reason);
      this.#debuggerConnection = null;
    }
  }

  /**
   * Used to recreate the device connection if there is a device ID collision.
   * 1. Checks if the same device is attempting to reconnect for the same app.
   * 2. If not, close both the device and debugger socket.
   * 3. If the debugger connection can be reused, close the device socket only.
   *
   * This hack attempts to allow users to reload the app, either as result of a
   * crash, or manually reloading, without having to restart the debugger.
   */
  dangerouslyRecreateDevice(deviceOptions: DeviceOptions) {
    invariant(
      deviceOptions.id === this.#id,
      'dangerouslyRecreateDevice() can only be used for the same device ID',
    );

    const oldDebugger = this.#debuggerConnection;

    if (this.#app !== deviceOptions.app || this.#name !== deviceOptions.name) {
      this.#deviceSocket.close(
        WS_CLOSURE_CODE.NORMAL,
        WS_CLOSE_REASON.RECREATING_DEVICE,
      );
      this.#terminateDebuggerConnection(
        WS_CLOSURE_CODE.NORMAL,
        WS_CLOSE_REASON.RECREATING_DEVICE,
      );
    }

    this.#debuggerConnection = null;

    if (oldDebugger) {
      oldDebugger.socket.removeAllListeners();
      this.#deviceSocket.close(
        WS_CLOSURE_CODE.NORMAL,
        WS_CLOSE_REASON.RECREATING_DEVICE,
      );
      this.handleDebuggerConnection(oldDebugger.socket, oldDebugger.pageId, {
        debuggerRelativeBaseUrl: oldDebugger.debuggerRelativeBaseUrl,
        userAgent: oldDebugger.userAgent,
      });
    }

    this.#dangerouslyConstruct(deviceOptions);
  }

  getName(): string {
    return this.#name;
  }

  getApp(): string {
    return this.#app;
  }

  getPagesList(): $ReadOnlyArray<Page> {
    if (this.#lastConnectedLegacyReactNativePage) {
      return [...this.#pages.values(), this.#createSyntheticPage()];
    } else {
      return [...this.#pages.values()];
    }
  }

  // Handles new debugger connection to this device:
  // 1. Sends connect event to device
  // 2. Forwards all messages from the debugger to device as wrappedEvent
  // 3. Sends disconnect event to device when debugger connection socket closes.
  handleDebuggerConnection(
    socket: WS,
    pageId: string,
    {
      debuggerRelativeBaseUrl,
      userAgent,
    }: $ReadOnly<{
      debuggerRelativeBaseUrl: URL,
      userAgent: string | null,
    }>,
  ) {
    const page: ?Page =
      pageId === REACT_NATIVE_RELOADABLE_PAGE_ID
        ? this.#createSyntheticPage()
        : this.#pages.get(pageId);

    if (!page) {
      debug(
        `Got new debugger connection via ${debuggerRelativeBaseUrl.href} for ` +
          `page ${pageId} of ${this.#name}, but no such page exists`,
      );
      socket.close(
        WS_CLOSURE_CODE.INTERNAL_ERROR,
        WS_CLOSE_REASON.PAGE_NOT_FOUND,
      );
      return;
    }

    // Clear any commands we were waiting on.
    this.#deviceEventReporter?.logDisconnection('debugger');

    // Disconnect current debugger if we already have debugger connected.
    this.#terminateDebuggerConnection(
      WS_CLOSURE_CODE.NORMAL,
      WS_CLOSE_REASON.NEW_DEBUGGER_OPENED,
    );

    this.#deviceEventReporter?.logConnection('debugger', {
      pageId,
      frontendUserAgent: userAgent,
    });

    const debuggerInfo = {
      socket,
      prependedFilePrefix: false,
      pageId,
      userAgent: userAgent,
      customHandler: null,
      debuggerRelativeBaseUrl,
    };

    this.#debuggerConnection = debuggerInfo;

    debug(
      `Got new debugger connection via ${debuggerRelativeBaseUrl.href} for ` +
        `page ${pageId} of ${this.#name}`,
    );

    if (this.#debuggerConnection && this.#createCustomMessageHandler) {
      this.#debuggerConnection.customHandler = this.#createCustomMessageHandler(
        {
          page,
          debugger: {
            userAgent: debuggerInfo.userAgent,
            sendMessage: message => {
              try {
                const payload = JSON.stringify(message);
                this.#cdpDebugLogging.log('ProxyToDebugger', payload);
                socket.send(payload);
              } catch {}
            },
          },
          device: {
            appId: this.#app,
            id: this.#id,
            name: this.#name,
            sendMessage: message => {
              try {
                const payload = JSON.stringify({
                  event: 'wrappedEvent',
                  payload: {
                    pageId: this.#mapToDevicePageId(pageId),
                    wrappedEvent: JSON.stringify(message),
                  },
                });
                this.#cdpDebugLogging.log('DebuggerToProxy', payload);
                this.#deviceSocket.send(payload);
              } catch {}
            },
          },
        },
      );

      if (this.#debuggerConnection.customHandler) {
        debug('Created new custom message handler for debugger connection');
      } else {
        debug(
          'Skipping new custom message handler for debugger connection, factory function returned null',
        );
      }
    }

    this.#sendConnectEventToDevice(this.#mapToDevicePageId(pageId));

    // $FlowFixMe[incompatible-call]
    socket.on('message', (message: string) => {
      this.#cdpDebugLogging.log('DebuggerToProxy', message);
      const debuggerRequest = JSON.parse(message);
      this.#deviceEventReporter?.logRequest(debuggerRequest, 'debugger', {
        pageId: this.#debuggerConnection?.pageId ?? null,
        frontendUserAgent: userAgent,
        prefersFuseboxFrontend: this.#isPageFuseboxFrontend(
          this.#debuggerConnection?.pageId,
        ),
      });
      let processedReq = debuggerRequest;

      if (
        this.#debuggerConnection?.customHandler?.handleDebuggerMessage(
          debuggerRequest,
        ) === true
      ) {
        return;
      }

      if (!this.#pageHasCapability(page, 'nativeSourceCodeFetching')) {
        processedReq = this.#interceptClientMessageForSourceFetching(
          debuggerRequest,
          debuggerInfo,
          socket,
        );
      }

      if (processedReq) {
        this.#sendMessageToDevice({
          event: 'wrappedEvent',
          payload: {
            pageId: this.#mapToDevicePageId(pageId),
            wrappedEvent: JSON.stringify(processedReq),
          },
        });
      }
    });
    socket.on('close', () => {
      debug(`Debugger for page ${pageId} and ${this.#name} disconnected.`);
      this.#deviceEventReporter?.logDisconnection('debugger');
      if (this.#debuggerConnection?.socket === socket) {
        this.#terminateDebuggerConnection();
      }
    });

    const cdpDebugLogging = this.#cdpDebugLogging;
    // $FlowFixMe[method-unbinding]
    const sendFunc = socket.send;
    // $FlowFixMe[cannot-write]
    socket.send = function (message: string) {
      cdpDebugLogging.log('ProxyToDebugger', message);
      return sendFunc.call(socket, message);
    };
  }

  #sendConnectEventToDevice(devicePageId: string) {
    if (this.#connectedPageIds.has(devicePageId)) {
      return;
    }
    this.#connectedPageIds.add(devicePageId);
    this.#sendMessageToDevice({
      event: 'connect',
      payload: {pageId: devicePageId},
    });
  }

  #sendDisconnectEventToDevice(devicePageId: string) {
    if (!this.#connectedPageIds.has(devicePageId)) {
      return;
    }
    this.#connectedPageIds.delete(devicePageId);
    this.#sendMessageToDevice({
      event: 'disconnect',
      payload: {pageId: devicePageId},
    });
  }

  /**
   * Returns `true` if a page supports the given target capability flag.
   */
  #pageHasCapability(page: Page, flag: $Keys<TargetCapabilityFlags>): boolean {
    return page.capabilities[flag] === true;
  }

  /**
   * Returns the synthetic "React Native Experimental (Improved Chrome Reloads)" page.
   */
  #createSyntheticPage(): Page {
    return {
      id: REACT_NATIVE_RELOADABLE_PAGE_ID,
      title: 'React Native Experimental (Improved Chrome Reloads)',
      vm: "don't use",
      app: this.#app,
      capabilities: {},
    };
  }

  // Handles messages received from device:
  // 1. For getPages responses updates local #pages list.
  // 2. All other messages are forwarded to debugger as wrappedEvent.
  //
  // In the future more logic will be added to this method for modifying
  // some of the messages (like updating messages with source maps and file
  // locations).
  #handleMessageFromDevice(message: MessageFromDevice) {
    if (message.event === 'getPages') {
      // Preserve ordering - getPages guarantees addition order.
      this.#pages = new Map(
        message.payload.map(({capabilities, ...page}) => [
          page.id,
          {
            ...page,
            capabilities: capabilities ?? {},
          },
        ]),
      );
      if (message.payload.length !== this.#pages.size) {
        const duplicateIds = new Set<string>();
        const idsSeen = new Set<string>();
        for (const page of message.payload) {
          if (!idsSeen.has(page.id)) {
            idsSeen.add(page.id);
          } else {
            duplicateIds.add(page.id);
          }
        }
        debug(
          `Received duplicate page IDs from device: ${[...duplicateIds].join(
            ', ',
          )}`,
        );
      }

      // Check if device has a new legacy React Native page.
      // There is usually no more than 2-3 pages per device so this operation
      // is not expensive.
      // TODO(hypuk): It is better for VM to send update event when new page is
      // created instead of manually checking this on every getPages result.
      for (const page of this.#pages.values()) {
        if (this.#pageHasCapability(page, 'nativePageReloads')) {
          this.#logFuseboxConsoleNotice();
          continue;
        }

        if (page.title.includes('React')) {
          if (page.id !== this.#lastConnectedLegacyReactNativePage?.id) {
            this.#newLegacyReactNativePage(page);
            break;
          }
        }
      }
    } else if (message.event === 'disconnect') {
      // Device sends disconnect events only when page is reloaded or
      // if debugger socket was disconnected.
      const pageId = message.payload.pageId;
      // TODO(moti): Handle null case explicitly, e.g. swallow disconnect events
      // for unknown pages.
      const page: ?Page = this.#pages.get(pageId);

      if (page != null && this.#pageHasCapability(page, 'nativePageReloads')) {
        return;
      }

      const debuggerSocket = this.#debuggerConnection
        ? this.#debuggerConnection.socket
        : null;
      if (debuggerSocket && debuggerSocket.readyState === WS.OPEN) {
        if (
          this.#debuggerConnection != null &&
          this.#debuggerConnection.pageId !== REACT_NATIVE_RELOADABLE_PAGE_ID
        ) {
          debug(`Legacy page ${pageId} is reloading.`);
          debuggerSocket.send(JSON.stringify({method: 'reload'}));
        }
      }
    } else if (message.event === 'wrappedEvent') {
      if (this.#debuggerConnection == null) {
        return;
      }

      // FIXME: Is it possible that we received message for pageID that does not
      // correspond to current debugger connection?
      // TODO(moti): yes, fix multi-debugger case

      const debuggerSocket = this.#debuggerConnection.socket;
      if (debuggerSocket == null || debuggerSocket.readyState !== WS.OPEN) {
        // TODO(hypuk): Send error back to device?
        return;
      }

      const parsedPayload = JSON.parse(message.payload.wrappedEvent);
      const pageId = this.#debuggerConnection?.pageId ?? null;
      if ('id' in parsedPayload) {
        this.#deviceEventReporter?.logResponse(parsedPayload, 'device', {
          pageId,
          frontendUserAgent: this.#debuggerConnection?.userAgent ?? null,
          prefersFuseboxFrontend: this.#isPageFuseboxFrontend(pageId),
        });
      }

      const debuggerConnection = this.#debuggerConnection;
      if (debuggerConnection != null) {
        if (
          debuggerConnection.customHandler?.handleDeviceMessage(
            parsedPayload,
          ) === true
        ) {
          return;
        }

        this.#processMessageFromDeviceLegacy(
          parsedPayload,
          debuggerConnection,
          pageId,
        );
        const messageToSend = JSON.stringify(parsedPayload);
        debuggerSocket.send(messageToSend);
      } else {
        debuggerSocket.send(message.payload.wrappedEvent);
      }
    }
  }

  // Sends single message to device.
  #sendMessageToDevice(message: MessageToDevice) {
    try {
      const messageToSend = JSON.stringify(message);
      if (message.event !== 'getPages') {
        this.#cdpDebugLogging.log('ProxyToDevice', messageToSend);
      }
      this.#deviceSocket.send(messageToSend);
    } catch (error) {}
  }

  // We received new React Native Page ID.
  #newLegacyReactNativePage(page: Page) {
    debug(`React Native page updated to ${page.id}`);
    if (
      this.#debuggerConnection == null ||
      this.#debuggerConnection.pageId !== REACT_NATIVE_RELOADABLE_PAGE_ID
    ) {
      // We can just remember new page ID without any further actions if no
      // debugger is currently attached or attached debugger is not
      // "Reloadable React Native" connection.
      this.#lastConnectedLegacyReactNativePage = page;
      return;
    }
    const oldPageId = this.#lastConnectedLegacyReactNativePage?.id;
    this.#lastConnectedLegacyReactNativePage = page;
    this.#isLegacyPageReloading = true;

    // We already had a debugger connected to React Native page and a
    // new one appeared - in this case we need to emulate execution context
    // detroy and resend Debugger.enable and Runtime.enable commands to new
    // page.

    if (oldPageId != null) {
      this.#sendDisconnectEventToDevice(oldPageId);
    }

    this.#sendConnectEventToDevice(page.id);

    const toSend = [
      {method: 'Runtime.enable', id: 1e9},
      {method: 'Debugger.enable', id: 1e9},
    ];

    for (const message of toSend) {
      const pageId = this.#debuggerConnection?.pageId ?? null;
      this.#deviceEventReporter?.logRequest(message, 'proxy', {
        pageId,
        frontendUserAgent: this.#debuggerConnection?.userAgent ?? null,
        prefersFuseboxFrontend: this.#isPageFuseboxFrontend(pageId),
      });
      this.#sendMessageToDevice({
        event: 'wrappedEvent',
        payload: {
          pageId: this.#mapToDevicePageId(page.id),
          wrappedEvent: JSON.stringify(message),
        },
      });
    }
  }

  /**
   * Given a URL from the debugger frontend, returns the equivalent URL
   * reachable from the device.
   */
  #debuggerRelativeToDeviceRelativeUrl(
    debuggerRelativeUrl: URL,
    {debuggerRelativeBaseUrl}: DebuggerConnection,
  ): URL {
    const deviceRelativeUrl = new URL(debuggerRelativeUrl.href);
    if (debuggerRelativeUrl.origin === debuggerRelativeBaseUrl.origin) {
      deviceRelativeUrl.hostname = this.#deviceRelativeBaseUrl.hostname;
      deviceRelativeUrl.port = this.#deviceRelativeBaseUrl.port;
      deviceRelativeUrl.protocol = this.#deviceRelativeBaseUrl.protocol;
    }
    return deviceRelativeUrl;
  }

  /**
   * Given a URL from the device, returns the equivalent URL reachable from
   * the debugger frontend.
   */
  #deviceRelativeUrlToDebuggerRelativeUrl(
    deviceRelativeUrl: URL,
    {debuggerRelativeBaseUrl}: DebuggerConnection,
  ): URL {
    const debuggerRelativeUrl = new URL(deviceRelativeUrl.href);
    if (deviceRelativeUrl.origin === this.#deviceRelativeBaseUrl.origin) {
      debuggerRelativeUrl.hostname = debuggerRelativeBaseUrl.hostname;
      debuggerRelativeUrl.port = debuggerRelativeBaseUrl.port;
      debuggerRelativeUrl.protocol = debuggerRelativeUrl.protocol;
    }
    return debuggerRelativeUrl;
  }

  /**
   * Given a URL from the device, returns the equivalent URL reachable from
   * this proxy.
   */
  #deviceRelativeUrlToServerRelativeUrl(deviceRelativeUrl: URL): URL {
    const debuggerRelativeUrl = new URL(deviceRelativeUrl.href);
    if (deviceRelativeUrl.origin === this.#deviceRelativeBaseUrl.origin) {
      debuggerRelativeUrl.hostname = this.#serverRelativeBaseUrl.hostname;
      debuggerRelativeUrl.port = this.#serverRelativeBaseUrl.port;
      debuggerRelativeUrl.protocol = this.#serverRelativeBaseUrl.protocol;
    }
    return debuggerRelativeUrl;
  }

  // Allows to make changes in incoming message from device.
  #processMessageFromDeviceLegacy(
    payload: CDPServerMessage,
    debuggerInfo: DebuggerConnection,
    pageId: ?string,
  ) {
    // TODO(moti): Handle null case explicitly, or ideally associate a copy
    // of the page metadata object with the connection so this can never be
    // null.
    const page: ?Page = pageId != null ? this.#pages.get(pageId) : null;

    // Replace Android addresses for scriptParsed event.
    if (
      (!page || !this.#pageHasCapability(page, 'nativeSourceCodeFetching')) &&
      payload.method === 'Debugger.scriptParsed' &&
      payload.params != null
    ) {
      const params = payload.params;
      if ('sourceMapURL' in params) {
        const sourceMapURL = this.#tryParseHTTPURL(params.sourceMapURL);
        if (sourceMapURL) {
          // Rewrite device-relative URLs to de debugger-relative URLs for the
          // frontend.
          payload.params.sourceMapURL =
            this.#deviceRelativeUrlToDebuggerRelativeUrl(
              sourceMapURL,
              debuggerInfo,
            ).href;
        }
      }
      if ('url' in params) {
        let serverRelativeUrl = params.url;
        const parsedUrl = this.#tryParseHTTPURL(params.url);
        if (parsedUrl) {
          // Rewrite device-relative URLs pointing to the server so that they're
          // reachable from the frontend.
          payload.params.url = this.#deviceRelativeUrlToDebuggerRelativeUrl(
            parsedUrl,
            debuggerInfo,
          ).href;

          // Determine the server-relative URL.
          serverRelativeUrl =
            this.#deviceRelativeUrlToServerRelativeUrl(parsedUrl).href;
        }

        // Chrome doesn't download source maps if URL param is not a valid
        // URL. Some frameworks pass alphanumeric script ID instead of URL which causes
        // Chrome to not download source maps. In this case we want to prepend script ID
        // with 'file://' prefix.
        if (payload.params.url.match(/^[0-9a-z]+$/)) {
          payload.params.url = FILE_PREFIX + payload.params.url;
          debuggerInfo.prependedFilePrefix = true;
        }

        if ('scriptId' in params && params.scriptId != null) {
          // Set a server-relative URL to locally fetch source by script ID
          // on Debugger.getScriptSource.
          this.#scriptIdToSourcePathMapping.set(
            params.scriptId,
            serverRelativeUrl,
          );
        }
      }
    }

    if (
      payload.method === 'Runtime.executionContextCreated' &&
      this.#isLegacyPageReloading
    ) {
      // The new context is ready. First notify Chrome that we've reloaded so
      // it'll resend its breakpoints. If we do this earlier, we may not be
      // ready to receive them.
      debuggerInfo.socket.send(
        JSON.stringify({method: 'Runtime.executionContextsCleared'}),
      );

      // The VM starts in a paused mode. Ask it to resume.
      // Note that if setting breakpoints in early initialization functions,
      // there's a currently race condition between these functions executing
      // and Chrome re-applying the breakpoints due to the message above.
      //
      // This is not an issue in VSCode/Nuclide where the IDE knows to resume
      // at its convenience.
      const resumeMessage = {method: 'Debugger.resume', id: 0};
      this.#deviceEventReporter?.logRequest(resumeMessage, 'proxy', {
        pageId: this.#debuggerConnection?.pageId ?? null,
        frontendUserAgent: this.#debuggerConnection?.userAgent ?? null,
        prefersFuseboxFrontend: this.#isPageFuseboxFrontend(
          this.#debuggerConnection?.pageId,
        ),
      });
      this.#sendMessageToDevice({
        event: 'wrappedEvent',
        payload: {
          pageId: this.#mapToDevicePageId(debuggerInfo.pageId),
          wrappedEvent: JSON.stringify(resumeMessage),
        },
      });

      this.#isLegacyPageReloading = false;
    }

    if (payload.method === 'Runtime.consoleAPICalled') {
      const callFrames = payload.params?.stackTrace?.callFrames ?? [];
      for (const callFrame of callFrames) {
        if (callFrame.url) {
          const parsedUrl = this.#tryParseHTTPURL(callFrame.url);
          if (parsedUrl) {
            // Rewrite device-relative URLs pointing to the server so that they're
            // reachable from the frontend.
            callFrame.url = this.#deviceRelativeUrlToDebuggerRelativeUrl(
              parsedUrl,
              debuggerInfo,
            ).href;
          }
        }
      }
    }
  }

  /**
   * Intercept an incoming message from a connected debugger. Returns either an
   * original/replacement CDP message object, or `null` (will forward nothing
   * to the target).
   */
  #interceptClientMessageForSourceFetching(
    req: CDPClientMessage,
    debuggerInfo: DebuggerConnection,
    socket: WS,
  ): CDPClientMessage | null {
    switch (req.method) {
      case 'Debugger.setBreakpointByUrl':
        return this.#processDebuggerSetBreakpointByUrl(req, debuggerInfo);
      case 'Debugger.getScriptSource':
        // Sends response to debugger via side-effect
        this.#processDebuggerGetScriptSource(req, socket);
        return null;
      case 'Network.loadNetworkResource':
        // If we're rewriting URLs (to frontend-relative), we don't want to
        // pass these URLs to the device, since it may try to fetch, return a
        // CDP *result* (not error) with a network failure, and CDT
        // will *not* then fall back to fetching locally.
        //
        // Instead, take the absence of a nativeSourceCodeFetching
        // capability as a signal to never pass a loadNetworkResource request
        // to the device. By returning a CDP error, the frontend should fetch.
        const result = {
          error: {
            code: -32601, // Method not found
            message:
              '[inspector-proxy]: Page lacks nativeSourceCodeFetching capability.',
          },
        };
        const response = {id: req.id, result};
        socket.send(JSON.stringify(response));
        const pageId = this.#debuggerConnection?.pageId ?? null;
        this.#deviceEventReporter?.logResponse(response, 'proxy', {
          pageId,
          frontendUserAgent: this.#debuggerConnection?.userAgent ?? null,
          prefersFuseboxFrontend: this.#isPageFuseboxFrontend(pageId),
        });
        return null;
      default:
        return req;
    }
  }

  #processDebuggerSetBreakpointByUrl(
    req: CDPRequest<'Debugger.setBreakpointByUrl'>,
    debuggerInfo: DebuggerConnection,
  ): CDPRequest<'Debugger.setBreakpointByUrl'> {
    // If we replaced Android emulator's address to localhost we need to change it back.
    const {debuggerRelativeBaseUrl, prependedFilePrefix} = debuggerInfo;

    const processedReq = {...req, params: {...req.params}};
    if (processedReq.params.url != null) {
      const originalUrlParam = processedReq.params.url;
      const httpUrl = this.#tryParseHTTPURL(originalUrlParam);
      if (httpUrl) {
        processedReq.params.url = this.#debuggerRelativeToDeviceRelativeUrl(
          httpUrl,
          debuggerInfo,
        ).href;
      } else if (
        originalUrlParam.startsWith(FILE_PREFIX) &&
        prependedFilePrefix
      ) {
        // Remove fake URL prefix if we modified URL in #processMessageFromDeviceLegacy.
        processedReq.params.url = originalUrlParam.slice(FILE_PREFIX.length);
      }
    }

    // Retain special case rewriting of localhost to device-relative IPs
    // within regex patterns. We don't rewrite the protocol here because
    // these patterns typically come from CDT reinterpreting the source URL
    // `file://host/path` into the regex `host/path|file://host/path`. See:
    //
    // https://github.com/ChromeDevTools/devtools-frontend/blob/f913cc6d76f2e2639c05b11ba673fc880b5490dd/front_end/core/sdk/DebuggerModel.ts#L505
    //
    // This has always been fragile and probably unnecessary - we don't set
    // `file://` source URLs. It can be removed when we drop support for
    // legacy targets, if not sooner.
    if (
      // Android's stock emulator and other emulators such as genymotion use a
      // standard localhost alias.
      new Set(['10.0.2.2', '10.0.3.2']).has(
        this.#deviceRelativeBaseUrl.hostname,
      ) &&
      debuggerRelativeBaseUrl.hostname === 'localhost' &&
      processedReq.params.urlRegex != null
    ) {
      processedReq.params.urlRegex = processedReq.params.urlRegex.replaceAll(
        'localhost',
        // regex-escape IPv4
        this.#deviceRelativeBaseUrl.hostname.replaceAll('.', '\\.'),
      );
    }
    return processedReq;
  }

  #processDebuggerGetScriptSource(
    req: CDPRequest<'Debugger.getScriptSource'>,
    socket: WS,
  ): void {
    const sendSuccessResponse = (scriptSource: string) => {
      const result = {scriptSource};
      const response: CDPResponse<'Debugger.getScriptSource'> = {
        id: req.id,
        result,
      };
      socket.send(JSON.stringify(response));
      const pageId = this.#debuggerConnection?.pageId ?? null;
      this.#deviceEventReporter?.logResponse(response, 'proxy', {
        pageId,
        frontendUserAgent: this.#debuggerConnection?.userAgent ?? null,
        prefersFuseboxFrontend: this.#isPageFuseboxFrontend(pageId),
      });
    };
    const sendErrorResponse = (error: string) => {
      // Tell the client that the request failed
      const result = {error: {message: error}};
      const response = {id: req.id, result};
      socket.send(JSON.stringify(response));

      // Send to the console as well, so the user can see it
      this.#sendErrorToDebugger(error);
      const pageId = this.#debuggerConnection?.pageId ?? null;
      this.#deviceEventReporter?.logResponse(response, 'proxy', {
        pageId,
        frontendUserAgent: this.#debuggerConnection?.userAgent ?? null,
        prefersFuseboxFrontend: this.#isPageFuseboxFrontend(pageId),
      });
    };

    const pathToSource = this.#scriptIdToSourcePathMapping.get(
      req.params.scriptId,
    );
    if (pathToSource != null) {
      const httpURL = this.#tryParseHTTPURL(pathToSource);
      if (httpURL) {
        // URL is server-relatve, so we should be able to fetch it from here.
        this.#fetchText(httpURL).then(
          text => sendSuccessResponse(text),
          err =>
            sendErrorResponse(
              `Failed to fetch source url ${pathToSource}: ${err.message}`,
            ),
        );
      } else {
        let file;
        try {
          file = fs.readFileSync(
            path.resolve(this.#projectRoot, pathToSource),
            'utf8',
          );
        } catch (err) {
          sendErrorResponse(
            `Failed to fetch source file ${pathToSource}: ${err.message}`,
          );
        }
        if (file != null) {
          sendSuccessResponse(file);
        }
      }
    }
  }

  #mapToDevicePageId(pageId: string): string {
    if (
      pageId === REACT_NATIVE_RELOADABLE_PAGE_ID &&
      this.#lastConnectedLegacyReactNativePage != null
    ) {
      return this.#lastConnectedLegacyReactNativePage.id;
    } else {
      return pageId;
    }
  }

  #tryParseHTTPURL(url: string): ?URL {
    let parsedURL: ?URL;
    try {
      parsedURL = new URL(url);
    } catch {}

    const protocol = parsedURL?.protocol;
    if (protocol !== 'http:' && protocol !== 'https:') {
      parsedURL = undefined;
    }

    return parsedURL;
  }

  // Fetch text, raising an exception if the text could not be fetched,
  // or is too large.
  async #fetchText(url: URL): Promise<string> {
    // $FlowFixMe[incompatible-call] Suppress arvr node-fetch flow error
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' ' + response.statusText);
    }
    const text = await response.text();
    // Restrict the length to well below the 500MB limit for nodejs (leaving
    // room some some later manipulation, e.g. base64 or wrapping in JSON)
    if (text.length > 350000000) {
      throw new Error('file too large to fetch via HTTP');
    }
    return text;
  }

  #sendErrorToDebugger(message: string) {
    const debuggerSocket = this.#debuggerConnection?.socket;
    if (debuggerSocket && debuggerSocket.readyState === WS.OPEN) {
      debuggerSocket.send(
        JSON.stringify({
          method: 'Runtime.consoleAPICalled',
          params: {
            args: [
              {
                type: 'string',
                value: message,
              },
            ],
            executionContextId: 0,
            type: 'error',
          },
        }),
      );
    }
  }

  #isPageFuseboxFrontend(pageId: ?string): boolean | null {
    const page = pageId == null ? null : this.#pages.get(pageId);
    if (page == null) {
      return null;
    }

    return this.#pageHasCapability(page, 'prefersFuseboxFrontend');
  }

  dangerouslyGetSocket(): WS {
    return this.#deviceSocket;
  }

  // TODO(T214991636): Remove notice
  #logFuseboxConsoleNotice() {
    if (fuseboxConsoleNoticeLogged) {
      return;
    }

    this.#deviceEventReporter?.logFuseboxConsoleNotice();
    fuseboxConsoleNoticeLogged = true;
  }
}

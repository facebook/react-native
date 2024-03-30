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

import DeviceEventReporter from './DeviceEventReporter';
import * as fs from 'fs';
import fetch from 'node-fetch';
import * as path from 'path';
import WS from 'ws';

const debug = require('debug')('Metro:InspectorProxy');

const PAGES_POLLING_INTERVAL = 1000;

// Android's stock emulator and other emulators such as genymotion use a standard localhost alias.
const EMULATOR_LOCALHOST_ADDRESSES: Array<string> = ['10.0.2.2', '10.0.3.2'];

// Prefix for script URLs that are alphanumeric IDs. See comment in #processMessageFromDeviceLegacy method for
// more details.
const FILE_PREFIX = 'file://';

type DebuggerInfo = {
  // Debugger web socket connection
  socket: WS,
  // If we replaced address (like '10.0.2.2') to localhost we need to store original
  // address because Chrome uses URL or urlRegex params (instead of scriptId) to set breakpoints.
  originalSourceURLAddress?: string,
  prependedFilePrefix: boolean,
  pageId: string,
  userAgent: string | null,
};

type DebuggerConnection = {
  ...DebuggerInfo,
  customHandler: ?CustomMessageHandler,
};

const REACT_NATIVE_RELOADABLE_PAGE_ID = '-1';

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

  // Sequences async processing of messages from device to preserve order. Only
  // necessary while we need to accommodate #processMessageFromDeviceLegacy's
  // async fetch.
  #messageFromDeviceQueue: Promise<void> = Promise.resolve();

  // Stores socket connection between Inspector Proxy and device.
  #deviceSocket: WS;

  // Stores the most recent listing of device's pages, keyed by the `id` field.
  #pages: $ReadOnlyMap<string, Page>;

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

  constructor(
    id: string,
    name: string,
    app: string,
    socket: WS,
    projectRoot: string,
    eventReporter: ?EventReporter,
    createMessageMiddleware: ?CreateCustomMessageHandlerFn,
  ) {
    this.#id = id;
    this.#name = name;
    this.#app = app;
    this.#pages = new Map();
    this.#deviceSocket = socket;
    this.#projectRoot = projectRoot;
    this.#deviceEventReporter = eventReporter
      ? new DeviceEventReporter(eventReporter, {
          deviceId: id,
          deviceName: name,
          appId: app,
        })
      : null;
    this.#createCustomMessageHandler = createMessageMiddleware;

    // $FlowFixMe[incompatible-call]
    this.#deviceSocket.on('message', (message: string) => {
      this.#messageFromDeviceQueue = this.#messageFromDeviceQueue
        .then(async () => {
          const parsedMessage = JSON.parse(message);
          if (parsedMessage.event === 'getPages') {
            // There's a 'getPages' message every second, so only show them if they change
            if (message !== this.#lastGetPagesMessage) {
              debug(
                '(Debugger)    (Proxy) <- (Device), getPages ping has changed: ' +
                  message,
              );
              this.#lastGetPagesMessage = message;
            }
          } else {
            debug('(Debugger)    (Proxy) <- (Device): ' + message);
          }
          await this.#handleMessageFromDevice(parsedMessage);
        })
        .catch(error => {
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
        });
    });
    // Sends 'getPages' request to device every PAGES_POLLING_INTERVAL milliseconds.
    this.#pagesPollingIntervalId = setInterval(
      () => this.#sendMessageToDevice({event: 'getPages'}),
      PAGES_POLLING_INTERVAL,
    );
    this.#deviceSocket.on('close', () => {
      this.#deviceEventReporter?.logDisconnection('device');
      // Device disconnected - close debugger connection.
      if (this.#debuggerConnection) {
        this.#debuggerConnection.socket.close();
        this.#debuggerConnection = null;
      }
      clearInterval(this.#pagesPollingIntervalId);
    });
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
    metadata: $ReadOnly<{
      userAgent: string | null,
    }>,
  ) {
    // Clear any commands we were waiting on.
    this.#deviceEventReporter?.logDisconnection('debugger');

    this.#deviceEventReporter?.logConnection('debugger', {
      pageId,
      frontendUserAgent: metadata.userAgent,
    });

    // Disconnect current debugger if we already have debugger connected.
    if (this.#debuggerConnection) {
      this.#debuggerConnection.socket.close();
      this.#debuggerConnection = null;
    }

    const debuggerInfo = {
      socket,
      prependedFilePrefix: false,
      pageId,
      userAgent: metadata.userAgent,
      customHandler: null,
    };

    // TODO(moti): Handle null case explicitly, e.g. refuse to connect to
    // unknown pages.
    const page: ?Page =
      pageId === REACT_NATIVE_RELOADABLE_PAGE_ID
        ? this.#createSyntheticPage()
        : this.#pages.get(pageId);

    this.#debuggerConnection = debuggerInfo;

    debug(`Got new debugger connection for page ${pageId} of ${this.#name}`);

    if (page && this.#debuggerConnection && this.#createCustomMessageHandler) {
      this.#debuggerConnection.customHandler = this.#createCustomMessageHandler(
        {
          page,
          debugger: {
            userAgent: debuggerInfo.userAgent,
            sendMessage: message => {
              try {
                const payload = JSON.stringify(message);
                debug('(Debugger) <- (Proxy)    (Device): ' + payload);
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
                debug('(Debugger) -> (Proxy)    (Device): ' + payload);
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

    this.#sendMessageToDevice({
      event: 'connect',
      payload: {
        pageId: this.#mapToDevicePageId(pageId),
      },
    });

    // $FlowFixMe[incompatible-call]
    socket.on('message', (message: string) => {
      debug('(Debugger) -> (Proxy)    (Device): ' + message);
      const debuggerRequest = JSON.parse(message);
      this.#deviceEventReporter?.logRequest(debuggerRequest, 'debugger', {
        pageId: this.#debuggerConnection?.pageId ?? null,
        frontendUserAgent: metadata.userAgent,
      });
      let processedReq = debuggerRequest;

      if (
        this.#debuggerConnection?.customHandler?.handleDebuggerMessage(
          debuggerRequest,
        ) === true
      ) {
        return;
      }

      if (!page || !this.#pageHasCapability(page, 'nativeSourceCodeFetching')) {
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
      this.#sendMessageToDevice({
        event: 'disconnect',
        payload: {
          pageId: this.#mapToDevicePageId(pageId),
        },
      });
      this.#debuggerConnection = null;
    });

    // $FlowFixMe[method-unbinding]
    const sendFunc = socket.send;
    // $FlowFixMe[cannot-write]
    socket.send = function (message: string) {
      debug('(Debugger) <- (Proxy)    (Device): ' + message);
      return sendFunc.call(socket, message);
    };
  }

  /**
   * Handles cleaning up a duplicate device connection, by client-side device ID.
   * 1. Checks if the same device is attempting to reconnect for the same app.
   * 2. If not, close both the device and debugger socket.
   * 3. If the debugger connection can be reused, close the device socket only.
   *
   * This allows users to reload the app, either as result of a crash, or manually
   * reloading, without having to restart the debugger.
   */
  handleDuplicateDeviceConnection(newDevice: Device) {
    if (
      this.#app !== newDevice.getApp() ||
      this.#name !== newDevice.getName()
    ) {
      this.#deviceSocket.close();
      this.#debuggerConnection?.socket.close();
    }

    const oldDebugger = this.#debuggerConnection;
    this.#debuggerConnection = null;

    if (oldDebugger) {
      oldDebugger.socket.removeAllListeners();
      this.#deviceSocket.close();
      newDevice.handleDebuggerConnection(
        oldDebugger.socket,
        oldDebugger.pageId,
        {
          userAgent: oldDebugger.userAgent,
        },
      );
    }
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
  async #handleMessageFromDevice(message: MessageFromDevice) {
    if (message.event === 'getPages') {
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

        await this.#processMessageFromDeviceLegacy(
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
      if (message.event !== 'getPages') {
        debug('(Debugger)    (Proxy) -> (Device): ' + JSON.stringify(message));
      }
      this.#deviceSocket.send(JSON.stringify(message));
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
      this.#sendMessageToDevice({
        event: 'disconnect',
        payload: {
          pageId: oldPageId,
        },
      });
    }

    this.#sendMessageToDevice({
      event: 'connect',
      payload: {
        pageId: page.id,
      },
    });

    const toSend = [
      {method: 'Runtime.enable', id: 1e9},
      {method: 'Debugger.enable', id: 1e9},
    ];

    for (const message of toSend) {
      this.#deviceEventReporter?.logRequest(message, 'proxy', {
        pageId: this.#debuggerConnection?.pageId ?? null,
        frontendUserAgent: this.#debuggerConnection?.userAgent ?? null,
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

  // Allows to make changes in incoming message from device.
  async #processMessageFromDeviceLegacy(
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
        for (let i = 0; i < EMULATOR_LOCALHOST_ADDRESSES.length; ++i) {
          const address = EMULATOR_LOCALHOST_ADDRESSES[i];
          if (params.sourceMapURL.includes(address)) {
            // $FlowFixMe[cannot-write]
            payload.params.sourceMapURL = params.sourceMapURL.replace(
              address,
              'localhost',
            );
            debuggerInfo.originalSourceURLAddress = address;
          }
        }

        const sourceMapURL = this.#tryParseHTTPURL(params.sourceMapURL);
        if (sourceMapURL) {
          // Some debug clients do not support fetching HTTP URLs. If the
          // message headed to the debug client identifies the source map with
          // an HTTP URL, fetch the content here and convert the content to a
          // Data URL (which is more widely supported) before passing the
          // message to the debug client.
          try {
            const sourceMap = await this.#fetchText(sourceMapURL);
            // $FlowFixMe[cannot-write]
            payload.params.sourceMapURL =
              'data:application/json;charset=utf-8;base64,' +
              Buffer.from(sourceMap).toString('base64');
          } catch (exception) {
            this.#sendErrorToDebugger(
              `Failed to fetch source map ${params.sourceMapURL}: ${exception.message}`,
            );
          }
        }
      }
      if ('url' in params) {
        for (let i = 0; i < EMULATOR_LOCALHOST_ADDRESSES.length; ++i) {
          const address = EMULATOR_LOCALHOST_ADDRESSES[i];
          if (params.url.indexOf(address) >= 0) {
            // $FlowFixMe[cannot-write]
            payload.params.url = params.url.replace(address, 'localhost');
            debuggerInfo.originalSourceURLAddress = address;
          }
        }

        // Chrome doesn't download source maps if URL param is not a valid
        // URL. Some frameworks pass alphanumeric script ID instead of URL which causes
        // Chrome to not download source maps. In this case we want to prepend script ID
        // with 'file://' prefix.
        if (payload.params.url.match(/^[0-9a-z]+$/)) {
          // $FlowFixMe[cannot-write]
          payload.params.url = FILE_PREFIX + payload.params.url;
          debuggerInfo.prependedFilePrefix = true;
        }

        // $FlowFixMe[prop-missing]
        if (params.scriptId != null) {
          this.#scriptIdToSourcePathMapping.set(params.scriptId, params.url);
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
      default:
        return req;
    }
  }

  #processDebuggerSetBreakpointByUrl(
    req: CDPRequest<'Debugger.setBreakpointByUrl'>,
    debuggerInfo: DebuggerConnection,
  ): CDPRequest<'Debugger.setBreakpointByUrl'> {
    // If we replaced Android emulator's address to localhost we need to change it back.
    if (debuggerInfo.originalSourceURLAddress != null) {
      const processedReq = {...req, params: {...req.params}};
      if (processedReq.params.url != null) {
        processedReq.params.url = processedReq.params.url.replace(
          'localhost',
          debuggerInfo.originalSourceURLAddress,
        );

        if (
          processedReq.params.url &&
          processedReq.params.url.startsWith(FILE_PREFIX) &&
          debuggerInfo.prependedFilePrefix
        ) {
          // Remove fake URL prefix if we modified URL in #processMessageFromDeviceLegacy.
          // $FlowFixMe[incompatible-use]
          processedReq.params.url = processedReq.params.url.slice(
            FILE_PREFIX.length,
          );
        }
      }
      if (processedReq.params.urlRegex != null) {
        processedReq.params.urlRegex = processedReq.params.urlRegex.replace(
          /localhost/g,
          // $FlowFixMe[incompatible-call]
          debuggerInfo.originalSourceURLAddress,
        );
      }
      return processedReq;
    }
    return req;
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
      this.#deviceEventReporter?.logResponse(response, 'proxy', {
        pageId: this.#debuggerConnection?.pageId ?? null,
        frontendUserAgent: this.#debuggerConnection?.userAgent ?? null,
      });
    };
    const sendErrorResponse = (error: string) => {
      // Tell the client that the request failed
      const result = {error: {message: error}};
      const response = {id: req.id, result};
      socket.send(JSON.stringify(response));

      // Send to the console as well, so the user can see it
      this.#sendErrorToDebugger(error);
      this.#deviceEventReporter?.logResponse(response, 'proxy', {
        pageId: this.#debuggerConnection?.pageId ?? null,
        frontendUserAgent: this.#debuggerConnection?.userAgent ?? null,
      });
    };

    const pathToSource = this.#scriptIdToSourcePathMapping.get(
      req.params.scriptId,
    );
    if (pathToSource != null) {
      const httpURL = this.#tryParseHTTPURL(pathToSource);
      if (httpURL) {
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
}

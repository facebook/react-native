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

import type {
  DebuggerRequest,
  ErrorResponse,
  GetScriptSourceRequest,
  GetScriptSourceResponse,
  MessageFromDevice,
  MessageToDevice,
  Page,
  SetBreakpointByUrlRequest,
} from './types';

import DeviceEventReporter from './DeviceEventReporter';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import WS from 'ws';
import type {EventReporter} from '../types/EventReporter';

const debug = require('debug')('Metro:InspectorProxy');

const PAGES_POLLING_INTERVAL = 1000;

// Android's stock emulator and other emulators such as genymotion use a standard localhost alias.
const EMULATOR_LOCALHOST_ADDRESSES: Array<string> = ['10.0.2.2', '10.0.3.2'];

// Prefix for script URLs that are alphanumeric IDs. See comment in _processMessageFromDevice method for
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

const REACT_NATIVE_RELOADABLE_PAGE_ID = '-1';

/**
 * Device class represents single device connection to Inspector Proxy. Each device
 * can have multiple inspectable pages.
 */
export default class Device {
  // ID of the device.
  _id: string;

  // Name of the device.
  _name: string;

  // Package name of the app.
  _app: string;

  // Stores socket connection between Inspector Proxy and device.
  _deviceSocket: WS;

  // Stores last list of device's pages.
  _pages: Array<Page>;

  // Stores information about currently connected debugger (if any).
  _debuggerConnection: ?DebuggerInfo = null;

  // Last known Page ID of the React Native page.
  // This is used by debugger connections that don't have PageID specified
  // (and will interact with the latest React Native page).
  _lastConnectedReactNativePage: ?Page = null;

  // Whether we are in the middle of a reload in the REACT_NATIVE_RELOADABLE_PAGE.
  _isReloading: boolean = false;

  // The previous "GetPages" message, for deduplication in debug logs.
  _lastGetPagesMessage: string = '';

  // Mapping built from scriptParsed events and used to fetch file content in `Debugger.getScriptSource`.
  _scriptIdToSourcePathMapping: Map<string, string> = new Map();

  // Root of the project used for relative to absolute source path conversion.
  _projectRoot: string;

  _deviceEventReporter: ?DeviceEventReporter;

  constructor(
    id: string,
    name: string,
    app: string,
    socket: WS,
    projectRoot: string,
    eventReporter: ?EventReporter,
  ) {
    this._id = id;
    this._name = name;
    this._app = app;
    this._pages = [];
    this._deviceSocket = socket;
    this._projectRoot = projectRoot;
    this._deviceEventReporter = eventReporter
      ? new DeviceEventReporter(eventReporter, {
          deviceId: id,
          deviceName: name,
          appId: app,
        })
      : null;

    // $FlowFixMe[incompatible-call]
    this._deviceSocket.on('message', (message: string) => {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.event === 'getPages') {
        // There's a 'getPages' message every second, so only show them if they change
        if (message !== this._lastGetPagesMessage) {
          debug(
            '(Debugger)    (Proxy) <- (Device), getPages ping has changed: ' +
              message,
          );
          this._lastGetPagesMessage = message;
        }
      } else {
        debug('(Debugger)    (Proxy) <- (Device): ' + message);
      }
      this._handleMessageFromDevice(parsedMessage);
    });
    this._deviceSocket.on('close', () => {
      this._deviceEventReporter?.logDisconnection('device');
      // Device disconnected - close debugger connection.
      if (this._debuggerConnection) {
        this._debuggerConnection.socket.close();
        this._debuggerConnection = null;
      }
    });

    this._setPagesPolling();
  }

  getName(): string {
    return this._name;
  }

  getApp(): string {
    return this._app;
  }

  getPagesList(): Array<Page> {
    if (this._lastConnectedReactNativePage) {
      const reactNativeReloadablePage = {
        id: REACT_NATIVE_RELOADABLE_PAGE_ID,
        title: 'React Native Experimental (Improved Chrome Reloads)',
        vm: "don't use",
        app: this._app,
      };
      return this._pages.concat(reactNativeReloadablePage);
    } else {
      return this._pages;
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
    this._deviceEventReporter?.logDisconnection('debugger');

    this._deviceEventReporter?.logConnection('debugger', {
      pageId,
      frontendUserAgent: metadata.userAgent,
    });

    // Disconnect current debugger if we already have debugger connected.
    if (this._debuggerConnection) {
      this._debuggerConnection.socket.close();
      this._debuggerConnection = null;
    }

    const debuggerInfo = {
      socket,
      prependedFilePrefix: false,
      pageId,
      userAgent: metadata.userAgent,
    };
    this._debuggerConnection = debuggerInfo;

    debug(`Got new debugger connection for page ${pageId} of ${this._name}`);

    this._sendMessageToDevice({
      event: 'connect',
      payload: {
        pageId: this._mapToDevicePageId(pageId),
      },
    });

    // $FlowFixMe[incompatible-call]
    socket.on('message', (message: string) => {
      debug('(Debugger) -> (Proxy)    (Device): ' + message);
      const debuggerRequest = JSON.parse(message);
      this._deviceEventReporter?.logRequest(debuggerRequest, 'debugger', {
        pageId: this._debuggerConnection?.pageId ?? null,
        frontendUserAgent: metadata.userAgent,
      });
      const handled = this._interceptMessageFromDebugger(
        debuggerRequest,
        debuggerInfo,
        socket,
      );

      if (!handled) {
        this._sendMessageToDevice({
          event: 'wrappedEvent',
          payload: {
            pageId: this._mapToDevicePageId(pageId),
            wrappedEvent: JSON.stringify(debuggerRequest),
          },
        });
      }
    });
    socket.on('close', () => {
      debug(`Debugger for page ${pageId} and ${this._name} disconnected.`);
      this._deviceEventReporter?.logDisconnection('debugger');
      this._sendMessageToDevice({
        event: 'disconnect',
        payload: {
          pageId: this._mapToDevicePageId(pageId),
        },
      });
      this._debuggerConnection = null;
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
      this._app !== newDevice.getApp() ||
      this._name !== newDevice.getName()
    ) {
      this._deviceSocket.close();
      this._debuggerConnection?.socket.close();
    }

    const oldDebugger = this._debuggerConnection;
    this._debuggerConnection = null;

    if (oldDebugger) {
      oldDebugger.socket.removeAllListeners();
      this._deviceSocket.close();
      newDevice.handleDebuggerConnection(
        oldDebugger.socket,
        oldDebugger.pageId,
        {
          userAgent: oldDebugger.userAgent,
        },
      );
    }
  }

  // Handles messages received from device:
  // 1. For getPages responses updates local _pages list.
  // 2. All other messages are forwarded to debugger as wrappedEvent.
  //
  // In the future more logic will be added to this method for modifying
  // some of the messages (like updating messages with source maps and file
  // locations).
  _handleMessageFromDevice(message: MessageFromDevice) {
    if (message.event === 'getPages') {
      this._pages = message.payload;

      // Check if device have new React Native page.
      // There is usually no more than 2-3 pages per device so this operation
      // is not expensive.
      // TODO(hypuk): It is better for VM to send update event when new page is
      // created instead of manually checking this on every getPages result.
      for (let i = 0; i < this._pages.length; ++i) {
        if (this._pages[i].title.indexOf('React') >= 0) {
          if (this._pages[i].id !== this._lastConnectedReactNativePage?.id) {
            this._newReactNativePage(this._pages[i]);
            break;
          }
        }
      }
    } else if (message.event === 'disconnect') {
      // Device sends disconnect events only when page is reloaded or
      // if debugger socket was disconnected.
      const pageId = message.payload.pageId;
      const debuggerSocket = this._debuggerConnection
        ? this._debuggerConnection.socket
        : null;
      if (debuggerSocket && debuggerSocket.readyState === WS.OPEN) {
        if (
          this._debuggerConnection != null &&
          this._debuggerConnection.pageId !== REACT_NATIVE_RELOADABLE_PAGE_ID
        ) {
          debug(`Page ${pageId} is reloading.`);
          debuggerSocket.send(JSON.stringify({method: 'reload'}));
        }
      }
    } else if (message.event === 'wrappedEvent') {
      if (this._debuggerConnection == null) {
        return;
      }

      // FIXME: Is it possible that we received message for pageID that does not
      // correspond to current debugger connection?

      const debuggerSocket = this._debuggerConnection.socket;
      if (debuggerSocket == null || debuggerSocket.readyState !== WS.OPEN) {
        // TODO(hypuk): Send error back to device?
        return;
      }

      const parsedPayload = JSON.parse(message.payload.wrappedEvent);
      if ('id' in parsedPayload) {
        this._deviceEventReporter?.logResponse(parsedPayload, 'device', {
          pageId: this._debuggerConnection?.pageId ?? null,
          frontendUserAgent: this._debuggerConnection?.userAgent ?? null,
        });
      }

      if (this._debuggerConnection) {
        // Wrapping just to make flow happy :)
        // $FlowFixMe[unused-promise]
        this._processMessageFromDevice(
          parsedPayload,
          this._debuggerConnection,
        ).then(() => {
          const messageToSend = JSON.stringify(parsedPayload);
          debuggerSocket.send(messageToSend);
        });
      }
    }
  }

  // Sends single message to device.
  _sendMessageToDevice(message: MessageToDevice) {
    try {
      if (message.event !== 'getPages') {
        debug('(Debugger)    (Proxy) -> (Device): ' + JSON.stringify(message));
      }
      this._deviceSocket.send(JSON.stringify(message));
    } catch (error) {}
  }

  // Sends 'getPages' request to device every PAGES_POLLING_INTERVAL milliseconds.
  _setPagesPolling() {
    setInterval(
      () => this._sendMessageToDevice({event: 'getPages'}),
      PAGES_POLLING_INTERVAL,
    );
  }

  // We received new React Native Page ID.
  _newReactNativePage(page: Page) {
    debug(`React Native page updated to ${page.id}`);
    if (
      this._debuggerConnection == null ||
      this._debuggerConnection.pageId !== REACT_NATIVE_RELOADABLE_PAGE_ID
    ) {
      // We can just remember new page ID without any further actions if no
      // debugger is currently attached or attached debugger is not
      // "Reloadable React Native" connection.
      this._lastConnectedReactNativePage = page;
      return;
    }
    const oldPageId = this._lastConnectedReactNativePage?.id;
    this._lastConnectedReactNativePage = page;
    this._isReloading = true;

    // We already had a debugger connected to React Native page and a
    // new one appeared - in this case we need to emulate execution context
    // detroy and resend Debugger.enable and Runtime.enable commands to new
    // page.

    if (oldPageId != null) {
      this._sendMessageToDevice({
        event: 'disconnect',
        payload: {
          pageId: oldPageId,
        },
      });
    }

    this._sendMessageToDevice({
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
      this._deviceEventReporter?.logRequest(message, 'proxy', {
        pageId: this._debuggerConnection?.pageId ?? null,
        frontendUserAgent: this._debuggerConnection?.userAgent ?? null,
      });
      this._sendMessageToDevice({
        event: 'wrappedEvent',
        payload: {
          pageId: this._mapToDevicePageId(page.id),
          wrappedEvent: JSON.stringify(message),
        },
      });
    }
  }

  // Allows to make changes in incoming message from device.
  async _processMessageFromDevice(
    payload: {method: string, params: {sourceMapURL: string, url: string}},
    debuggerInfo: DebuggerInfo,
  ) {
    // Replace Android addresses for scriptParsed event.
    if (payload.method === 'Debugger.scriptParsed') {
      const params = payload.params || {};
      if ('sourceMapURL' in params) {
        for (let i = 0; i < EMULATOR_LOCALHOST_ADDRESSES.length; ++i) {
          const address = EMULATOR_LOCALHOST_ADDRESSES[i];
          if (params.sourceMapURL.indexOf(address) >= 0) {
            payload.params.sourceMapURL = params.sourceMapURL.replace(
              address,
              'localhost',
            );
            debuggerInfo.originalSourceURLAddress = address;
          }
        }

        const sourceMapURL = this._tryParseHTTPURL(params.sourceMapURL);
        if (sourceMapURL) {
          // Some debug clients do not support fetching HTTP URLs. If the
          // message headed to the debug client identifies the source map with
          // an HTTP URL, fetch the content here and convert the content to a
          // Data URL (which is more widely supported) before passing the
          // message to the debug client.
          try {
            const sourceMap = await this._fetchText(sourceMapURL);
            payload.params.sourceMapURL =
              'data:application/json;charset=utf-8;base64,' +
              new Buffer(sourceMap).toString('base64');
          } catch (exception) {
            this._sendErrorToDebugger(
              `Failed to fetch source map ${params.sourceMapURL}: ${exception.message}`,
            );
          }
        }
      }
      if ('url' in params) {
        for (let i = 0; i < EMULATOR_LOCALHOST_ADDRESSES.length; ++i) {
          const address = EMULATOR_LOCALHOST_ADDRESSES[i];
          if (params.url.indexOf(address) >= 0) {
            payload.params.url = params.url.replace(address, 'localhost');
            debuggerInfo.originalSourceURLAddress = address;
          }
        }

        // Chrome doesn't download source maps if URL param is not a valid
        // URL. Some frameworks pass alphanumeric script ID instead of URL which causes
        // Chrome to not download source maps. In this case we want to prepend script ID
        // with 'file://' prefix.
        if (payload.params.url.match(/^[0-9a-z]+$/)) {
          payload.params.url = FILE_PREFIX + payload.params.url;
          debuggerInfo.prependedFilePrefix = true;
        }

        // $FlowFixMe[prop-missing]
        if (params.scriptId != null) {
          this._scriptIdToSourcePathMapping.set(params.scriptId, params.url);
        }
      }
    }

    if (
      payload.method === 'Runtime.executionContextCreated' &&
      this._isReloading
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
      this._deviceEventReporter?.logRequest(resumeMessage, 'proxy', {
        pageId: this._debuggerConnection?.pageId ?? null,
        frontendUserAgent: this._debuggerConnection?.userAgent ?? null,
      });
      this._sendMessageToDevice({
        event: 'wrappedEvent',
        payload: {
          pageId: this._mapToDevicePageId(debuggerInfo.pageId),
          wrappedEvent: JSON.stringify(resumeMessage),
        },
      });

      this._isReloading = false;
    }
  }

  // Allows to make changes in incoming messages from debugger. Returns a boolean
  // indicating whether the message has been handled locally (i.e. does not need
  // to be forwarded to the target).
  _interceptMessageFromDebugger(
    req: DebuggerRequest,
    debuggerInfo: DebuggerInfo,
    socket: WS,
  ): boolean {
    if (req.method === 'Debugger.setBreakpointByUrl') {
      this._processDebuggerSetBreakpointByUrl(req, debuggerInfo);
    } else if (req.method === 'Debugger.getScriptSource') {
      this._processDebuggerGetScriptSource(req, socket);
      return true;
    }
    return false;
  }

  _processDebuggerSetBreakpointByUrl(
    req: SetBreakpointByUrlRequest,
    debuggerInfo: DebuggerInfo,
  ) {
    // If we replaced Android emulator's address to localhost we need to change it back.
    if (debuggerInfo.originalSourceURLAddress != null) {
      if (req.params.url != null) {
        req.params.url = req.params.url.replace(
          'localhost',
          debuggerInfo.originalSourceURLAddress,
        );

        if (
          req.params.url &&
          req.params.url.startsWith(FILE_PREFIX) &&
          debuggerInfo.prependedFilePrefix
        ) {
          // Remove fake URL prefix if we modified URL in _processMessageFromDevice.
          // $FlowFixMe[incompatible-use]
          req.params.url = req.params.url.slice(FILE_PREFIX.length);
        }
      }
      if (req.params.urlRegex != null) {
        req.params.urlRegex = req.params.urlRegex.replace(
          /localhost/g,
          // $FlowFixMe[incompatible-call]
          debuggerInfo.originalSourceURLAddress,
        );
      }
    }
  }

  _processDebuggerGetScriptSource(req: GetScriptSourceRequest, socket: WS) {
    const sendSuccessResponse = (scriptSource: string) => {
      const result: GetScriptSourceResponse = {scriptSource};
      const response = {id: req.id, result};
      socket.send(JSON.stringify(response));
      this._deviceEventReporter?.logResponse(response, 'proxy', {
        pageId: this._debuggerConnection?.pageId ?? null,
        frontendUserAgent: this._debuggerConnection?.userAgent ?? null,
      });
    };
    const sendErrorResponse = (error: string) => {
      // Tell the client that the request failed
      const result: ErrorResponse = {error: {message: error}};
      const response = {id: req.id, result};
      socket.send(JSON.stringify(response));

      // Send to the console as well, so the user can see it
      this._sendErrorToDebugger(error);
      this._deviceEventReporter?.logResponse(response, 'proxy', {
        pageId: this._debuggerConnection?.pageId ?? null,
        frontendUserAgent: this._debuggerConnection?.userAgent ?? null,
      });
    };

    const pathToSource = this._scriptIdToSourcePathMapping.get(
      req.params.scriptId,
    );
    if (pathToSource != null) {
      const httpURL = this._tryParseHTTPURL(pathToSource);
      if (httpURL) {
        this._fetchText(httpURL).then(
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
            path.resolve(this._projectRoot, pathToSource),
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

  _mapToDevicePageId(pageId: string): string {
    if (
      pageId === REACT_NATIVE_RELOADABLE_PAGE_ID &&
      this._lastConnectedReactNativePage != null
    ) {
      return this._lastConnectedReactNativePage.id;
    } else {
      return pageId;
    }
  }

  _tryParseHTTPURL(url: string): ?URL {
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
  async _fetchText(url: URL): Promise<string> {
    if (url.hostname !== 'localhost') {
      throw new Error('remote fetches not permitted');
    }

    // $FlowFixMe[incompatible-call] Suppress arvr node-fetch flow error
    const response = await fetch(url);
    const text = await response.text();
    // Restrict the length to well below the 500MB limit for nodejs (leaving
    // room some some later manipulation, e.g. base64 or wrapping in JSON)
    if (text.length > 350000000) {
      throw new Error('file too large to fetch via HTTP');
    }
    return text;
  }

  _sendErrorToDebugger(message: string) {
    const debuggerSocket = this._debuggerConnection?.socket;
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

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 * This file implements a multi-device proxy for the Chrome debugging protocol. Each device connects
 * to the proxy over a single websocket connection that is able to multiplex messages to multiple
 * Javascript VMs. An inspector instance running in Chrome can connect to a specific VM via this
 * proxy.
 *
 * The connection to from device to the proxy uses a simple JSON-based protocol with the basic
 * structure { event: '<event-name>', payload: { ... }}. All events are send without acknowledgment
 * except the 'getPages' event where the device responds with the available pages. Most events will
 * be wrapped inspector events going to a specific 'page' on the device.
 *
 * See below for a diagram of how the devices, inspector(s) and proxy interact.
 *           +--------+
 *           | Device |                                            +------------+
 *           |   #1   |               +---------+                  |Chrome      |
 *           |        |               |         | Chrome debugging +------------+
 *           +--+--+  |    Custom     |         |     protocol     |Inspector   |
 *           |VM|VM|  |------+------->|  Proxy  |<----------+------|            |
 *           +--+--+--+      |        |         |           |      |            |
 *                           |        |         |           |      +------------+
 *           +--------+      |        +---------+           |      |Inspector   |
 *           | Device |------+                              +------|            |
 *           |   #2   |                                            |            |
 *           |        |                                            +------------+
 *           +--+     |
 *           |VM|     |
 *           +--+-----+
 */
'use strict';

const flatMapArray = require('fbjs/lib/flatMapArray');
const http = require('http');
const nullthrows = require('fbjs/lib/nullthrows');
const querystring = require('querystring');

const parseUrl = require('url').parse;
const WebSocket = require('ws');

const debug = require('debug')('RNP:InspectorProxy');
const launchChrome = require('./launchChrome');

import type {Server as HTTPSServer} from 'https';

type DevicePage = {
  id: string,
  title: string,
};

type Page = {
  id: string,
  title: string,
  description: string,
  devtoolsFrontendUrl: string,
  webSocketDebuggerUrl: string,
  deviceId: string,
  deviceName: string,
};

type Message<Name, Payload> = {
  event?: Name,
  payload?: Payload,
};

type WrappedEvent = Message<'wrappedEvent', {
  pageId?: string,
  wrappedEvent?: string,
}>;

type ConnectEvent = Message<'connect', {
  pageId?: string,
}>;

type DisconnectEvent = Message<'disconnect', {
  pageId?: string,
}>;

type OpenEvent = Message<'open', {
  pageId?: string,
}>;

type GetPages = Message<'getPages', ?Array<DevicePage>>;

type Event = WrappedEvent | ConnectEvent | DisconnectEvent | GetPages;

type Address = {
  address: string,
  port: number,
};

type Server = http.Server | HTTPSServer;

const DEVICE_TIMEOUT = 30000;

// FIXME: This is the url we want to use as it more closely matches the actual protocol we use.
// However, it's broken in Chrome 54+ due to it using 'KeyboardEvent.keyIdentifier'.
// const DEVTOOLS_URL_BASE = 'https://chrome-devtools-frontend.appspot.com/serve_rev/@178469/devtools.html?ws=';
const DEVTOOLS_URL_BASE = 'https://chrome-devtools-frontend.appspot.com/serve_file/@60cd6e859b9f557d2312f5bf532f6aec5f284980/inspector.html?ws=';

class Device {
  name: string;

  _id: string;
  _socket: WebSocket;
  _handlers: Map<string, (result?: Object) => void>;
  _connections: Map<string, WebSocket>;

  constructor(id: string, name: string, socket: WebSocket) {
    this.name = name;
    this._id = id;
    this._socket = socket;
    this._handlers = new Map();
    this._connections = new Map();

    this._socket.on('message', this._onMessage.bind(this));
    this._socket.on('close', this._onDeviceDisconnected.bind(this));
  }

  getPages(): Promise<Array<DevicePage>> {
    return this._callMethod('getPages');
  }

  connect(pageId: string, socket: WebSocket) {
    socket.on('message', (message: string) => {
      if (!this._connections.has(pageId)) {
        // Not connected, silently ignoring
        return;
      }

      // TODO: This should be handled way earlier, preferably in the inspector itself.
      // That is how it works it newer versions but it requires installing hooks.
      if (message.indexOf('Network.loadResourceForFrontend') !== -1) {
        this._loadResourceForFrontend(socket, JSON.parse(message));
        return;
      }

      this._send({
        event: 'wrappedEvent',
        payload: {
          pageId,
          wrappedEvent: message,
        },
      });
    });
    socket.on('close', () => {
      if (this._connections.has(pageId)) {
        this._send({event: 'disconnect', payload: {pageId: pageId}});
        this._removeConnection(pageId);
      }
    });
    this._connections.set(pageId, socket);
    this._send({event: 'connect', payload: {pageId: pageId}});
  }

  _callMethod(name: 'getPages'): Promise<any> {
    const promise = new Promise((fulfill, reject) => {
      const timerId = setTimeout(() => {
        this._handlers.delete(name);
        reject(new Error('Timeout waiting for device'));
      }, DEVICE_TIMEOUT);
      this._handlers.set(name, arg => {
        clearTimeout(timerId);
        fulfill(arg);
      });
    });
    this._send({event: name});
    return promise;
  }

  _send(message: Event) {
    debug('-> device', this._id, message);
    // This try/catch is unfortunate, but there is a small window where a message can be sent
    // 1. after the socket is closed, and
    // 2. before the callback for the 'close' event on the socket is run.
    // Since we don't want the packager to crash in this situation, we have to guard against this.
    try {
      this._socket.send(JSON.stringify(message));
    } catch (err) {
      debug('Error sending', err);
    }
  }

  _onMessage(json: string) {
    debug('<- device', this._id, json);
    const message = JSON.parse(json);
    const handler = this._handlers.get(message.event);
    if (handler) {
      this._handlers.delete(message.event);
      handler(message.payload);
      return;
    }

    if (message.event === 'wrappedEvent') {
      this._handleWrappedEvent(message);
    } else if (message.event === 'disconnect') {
      this._handleDisconnect(message);
    } else if (message.event === 'open') {
      this._handleOpen(message);
    }
  }

  _handleWrappedEvent(event: WrappedEvent) {
    const payload = nullthrows(event.payload);
    const socket = this._connections.get(nullthrows(payload.pageId));
    if (!socket) {
      console.error('Invalid pageId from device:', payload.pageId);
      return;
    }
    socket.send(payload.wrappedEvent);
  }

  _handleDisconnect(event: DisconnectEvent) {
    const payload = nullthrows(event.payload);
    const pageId = nullthrows(payload.pageId);
    this._removeConnection(pageId);
  }

  _handleOpen(event: OpenEvent) {
    const payload = nullthrows(event.payload);
    const pageId = nullthrows(payload.pageId);
    const url = DEVTOOLS_URL_BASE + makeInspectorPageUrl(this._id, pageId);
    launchChrome(url);
  }

  _removeConnection(pageId: string) {
    const socket = this._connections.get(pageId);
    if (socket) {
      this._connections.delete(pageId);
      socket.close();
    }
  }

  _onDeviceDisconnected() {
    for (const pageId of this._connections.keys()) {
      this._removeConnection(pageId);
    }
  }

  _loadResourceForFrontend(socket: WebSocket, event: Object) {
    const id: number = nullthrows(event.id);
    const url: string = nullthrows(nullthrows(event.params).url);
    debug('loadResourceForFrontend:', url);
    http.get(this._normalizeUrl(url), (response) => {
      // $FlowFixMe callback is optional
      response.setTimeout(0);
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        socket.send(JSON.stringify({
          id: id,
          result: {
            statusCode: response.statusCode,
            content: data,
            responseHeaders: response.headers,
          },
        }));
      });
      response.on('error', (error) => {
        console.error('Failed to get resource', error);
      });
    });
  }

  _normalizeUrl(url: string): string {
    return url.replace('http://10.0.3.2', 'http://localhost')
      .replace('http://10.0.2.2', 'http://localhost');
  }
}

class InspectorProxy {
  _devices: Map<string, Device>;
  _devicesCounter: number;

  constructor() {
    this._devices = new Map();
    this._devicesCounter = 0;
  }

  attachToServer(server: Server, pathPrefix: string) {
    this._createPageHandler(server, pathPrefix + '/page');
    this._createDeviceHandler(server, pathPrefix + '/device');
    this._createPagesListHandler(server, pathPrefix + '/');
    this._createPagesJsonHandler(server, pathPrefix + '/json');
  }

  _makePage(server: Address, deviceId: string, deviceName: string, devicePage: DevicePage): Page {
    const wsUrl = makeInspectorPageUrl(deviceId, devicePage.id);
    return {
      id: `${deviceId}-${devicePage.id}`,
      title: devicePage.title,
      description: '',
      devtoolsFrontendUrl: DEVTOOLS_URL_BASE + wsUrl,
      webSocketDebuggerUrl: `ws://${wsUrl}`,
      deviceId,
      deviceName,
    };
  }

  _getPages(localAddress: Address): Promise<Array<Page>> {
    const promises = Array.from(this._devices.entries(), ([deviceId, device]) => {
      return device.getPages().then((devicePages) => {
        return devicePages.map(this._makePage.bind(this, localAddress, deviceId, device.name));
      });
    });

    const flatMap = (arr) => flatMapArray(arr, (x) => x);
    return Promise.all(promises).then(flatMap);
  }

  processRequest(req: any, res: any, next: any) {
    // TODO: Might wanna actually do the handling here
    const endpoints = [
      '/inspector/',
      '/inspector/page',
      '/inspector/device',
      '/inspector/json',
    ];
    if (endpoints.indexOf(req.url) === -1) {
      next();
    }
  }

  _createDeviceHandler(server: Server, path: string) {
    const wss = new WebSocket.Server({
      server,
      path,
    });
    wss.on('connection', (socket: WebSocket) => {
      try {
        const query = parseUrl(socket.upgradeReq.url, true).query || {};
        const deviceName = query.name || 'Unknown';
        debug('Got device connection:', deviceName);
        const deviceId = String(this._devicesCounter++);
        const device = new Device(deviceId, deviceName, socket);
        this._devices.set(deviceId, device);
        socket.on('close', () => {
          this._devices.delete(deviceId);
        });
      } catch (e) {
        console.error(e);
        socket.close(1011, e.message);
      }
    });
  }

  _createPageHandler(server: Server, path: string) {
    const wss = new WebSocket.Server({
      server,
      path,
    });
    wss.on('connection', (socket: WebSocket) => {
      try {
        const url = parseUrl(socket.upgradeReq.url, false);
        const { device, page } = querystring.parse(
          querystring.unescape(nullthrows(url.query)));
        if (device === undefined || page === undefined) {
          throw Error('Must provide device and page');
        }
        const deviceObject = this._devices.get(device);
        if (!deviceObject) {
          throw Error('Unknown device: ' + device);
        }

        deviceObject.connect(page, socket);
      } catch (e) {
        console.error(e);
        socket.close(1011, e.message);
      }
    });
  }

  _createPagesJsonHandler(server: Server, path: string) {
    server.on('request', (request: http.IncomingMessage, response: http.ServerResponse) => {
      if (request.url === path) {
        this._getPages(server.address()).then((result: Array<Page>) => {
          response.writeHead(200, {'Content-Type': 'application/json'});
          response.end(JSON.stringify(result));
        }, (error: Error) => {
          response.writeHead(500);
          response.end('Internal error: ' + error.toString());
        });
      }
    });
  }

  _createPagesListHandler(server: Server, path: string) {
    server.on('request', (request: http.IncomingMessage, response: http.ServerResponse) => {
      if (request.url === path) {
        this._getPages(server.address()).then((result: Array<Page>) => {
          response.writeHead(200, {'Content-Type': 'text/html'});
          response.end(buildPagesHtml(result));
        }, (error: Error) => {
          response.writeHead(500);
          response.end('Internal error: ' + error.toString());
        });
      }
    });
  }

}

function buildPagesHtml(pages: Array<Page>): string {
  const pagesHtml = pages.map((page) => {
    return escapeHtml`
      <li style="padding: 5px;">
        <a href="${page.devtoolsFrontendUrl}">
          ${page.deviceName} / ${page.title}
        </a>
      </li>
    `;
  }).join('\n');

  return `
    <html>
      <head><title>Pages</title></head>
      <body>
        <h1>Pages</h1>
        <hr>
        <ul style="list-style: none;">
          ${pagesHtml}
        </ul>
      </body>
    </html>
  `;
}

function escapeHtml(pieces: Array<string>, ...substitutions: Array<string>): string {
  let result = pieces[0];
  for (let i = 0; i < substitutions.length; ++i) {
    result += substitutions[i].replace(/[<&"'>]/g, escapeHtmlSpecialChar) + pieces[i + 1];
  }

  return result;
}

function escapeHtmlSpecialChar(char: string): string {
  return (
    char === '&' ? '&amp;' :
    char === '"' ? '&quot;' :
    char === "'" ? '&#039;' :
    char === '<' ? '&lt;' :
    char === '>' ? '&gt;' :
    char
  );
}

function makeInspectorPageUrl(deviceId: string, pageId: string): string {
  // The inspector frontend doesn't handle urlencoded params so we
  // manually urlencode it and decode it on the other side in _createPageHandler
  const query = querystring.escape(`device=${deviceId}&page=${pageId}`);
  return `localhost:8081/inspector/page?${query}`;
}

function attachToServer(server: http.Server, pathPrefix: string): InspectorProxy {
  const proxy = new InspectorProxy();
  proxy.attachToServer(server, pathPrefix);
  return proxy;
}

if (!module.parent) {
  console.info('Starting server');
  process.env.DEBUG = 'RNP:Inspector';
  const serverInstance = http.createServer().listen(
    8081,
    'localhost',
    undefined,
    function() {
      attachToServer(serverInstance, '/inspector');
    }
  );
  serverInstance.timeout = 0;
}

// module.exports.attachToServer = attachToServer;
module.exports = InspectorProxy;

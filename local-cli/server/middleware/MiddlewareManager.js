/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @strict
 * @flow
 */

const compression = require('compression');
const connect = require('connect');
const errorhandler = require('errorhandler');
const path = require('path');
const serveStatic = require('serve-static');
const WebSocketServer = require('ws').Server;

const indexPageMiddleware = require('./indexPage');
const copyToClipBoardMiddleware = require('./copyToClipBoardMiddleware');
const getSecurityHeadersMiddleware =  require('./getSecurityHeadersMiddleware');
const loadRawBodyMiddleware = require('./loadRawBodyMiddleware');
const openStackFrameInEditorMiddleware = require('./openStackFrameInEditorMiddleware');
const statusPageMiddleware = require('./statusPageMiddleware');
const systraceProfileMiddleware = require('./systraceProfileMiddleware');
const getDevToolsMiddleware = require('./getDevToolsMiddleware');

type Options = {
  +watchFolders: $ReadOnlyArray<string>,
  +host?: string,
}

type WebSocketProxy = {
  server: WebSocketServer,
  isChromeConnected: () => boolean,
};

type Connect = $Call<connect>;

module.exports = class MiddlewareManager {
  app: Connect;
  options: Options;

  constructor(options: Options) {
    const debuggerUIFolder = path.join(__dirname, '..', 'util', 'debugger-ui');

    this.options = options;
    this.app = connect()
      .use(getSecurityHeadersMiddleware)
      .use(loadRawBodyMiddleware)
      .use(compression())
      .use('/debugger-ui', serveStatic(debuggerUIFolder))
      .use(openStackFrameInEditorMiddleware(this.options))
      .use(copyToClipBoardMiddleware)
      .use(statusPageMiddleware)
      .use(systraceProfileMiddleware)
      .use(indexPageMiddleware)
      .use(errorhandler());
  }

  serveStatic = (folder: string) => {
    this.app.use(serveStatic(folder));
  };

  getConnectInstance = () => this.app;

  attachDevToolsSocket = (socket: WebSocketProxy) => {
    this.app.use(
      getDevToolsMiddleware(this.options, () => socket.isChromeConnected()),
    );
  };
};

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

import {createDevMiddleware} from '../';
import connect from 'connect';
import http from 'http';
import https from 'https';
import * as selfsigned from 'selfsigned';
import url from 'url';

type CreateDevMiddlewareOptions = Parameters<typeof createDevMiddleware>[0];
type CreateServerOptions = {
  ...Omit<CreateDevMiddlewareOptions, 'serverBaseUrl'>,
  secure?: boolean,
};

export function withServerForEachTest(options: CreateServerOptions): $ReadOnly<{
  serverBaseUrl: string,
  serverBaseWsUrl: string,
}> {
  const ref: {serverBaseUrl: string, serverBaseWsUrl: string} = {
    // $FlowIgnore[unsafe-getters-setters]
    get serverBaseUrl() {
      throw new Error(
        'The return value of withServerForEachTest is lazily initialized and can only be accessed in tests.',
      );
    },
    // $FlowIgnore[unsafe-getters-setters]
    get serverBaseWsUrl() {
      throw new Error(
        'The return value of withServerForEachTest is lazily initialized and can only be accessed in tests.',
      );
    },
  };
  let server: http$Server | https$Server;
  beforeEach(async () => {
    server = await createServer(options);
    const serverBaseUrl = baseUrlForServer(
      server,
      options.secure ?? false ? 'https' : 'http',
    );
    const serverBaseWsUrl = baseUrlForServer(
      server,
      options.secure ?? false ? 'wss' : 'ws',
    );
    Object.defineProperty(ref, 'serverBaseUrl', {value: serverBaseUrl});
    Object.defineProperty(ref, 'serverBaseWsUrl', {value: serverBaseWsUrl});
  });
  afterEach(done => {
    server.close(() => done());
  });
  return ref;
}

export async function createServer(
  options: CreateServerOptions,
): Promise<http$Server | https$Server> {
  const app = connect();
  const {secure = false, ...devMiddlewareOptions} = options;
  let httpServer;
  if (secure) {
    const {cert, private: key} = selfsigned.generate(
      [{name: 'commonName', value: 'localhost'}],
      {days: 1},
    );
    httpServer = https.createServer(
      {cert, key},
      // $FlowFixMe[incompatible-call] The types for `connect` and `https` are subtly incompatible as written.
      app,
    );
  } else {
    httpServer = http.createServer(app);
  }

  return new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(() => {
      const {middleware, websocketEndpoints} = createDevMiddleware({
        ...devMiddlewareOptions,
        serverBaseUrl: baseUrlForServer(httpServer, secure ? 'https' : 'http'),
      });
      app.use(middleware);
      httpServer.on('upgrade', (request, socket, head) => {
        const {pathname} = url.parse(request.url);
        if (pathname != null && websocketEndpoints[pathname]) {
          websocketEndpoints[pathname].handleUpgrade(
            request,
            socket,
            head,
            ws => {
              websocketEndpoints[pathname].emit('connection', ws, request);
            },
          );
        } else {
          socket.destroy();
        }
      });
      resolve(httpServer);
    });
  });
}

export function baseUrlForServer(
  server: http$Server | https$Server,
  scheme: string,
): string {
  const address = server.address();
  // Assumption: `server` is local and listening on `localhost`. We can't use
  // the IP address because HTTPS requires a hostname.
  return `${scheme}://localhost:${address.port}`;
}

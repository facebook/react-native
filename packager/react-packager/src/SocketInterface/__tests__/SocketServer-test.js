/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.setMock('worker-farm', function() { return () => {}; })
    .setMock('uglify-js')
    .mock('net')
    .mock('fs')
    .dontMock('../SocketServer');

describe('SocketServer', () => {
  let PackagerServer;
  let SocketServer;
  let netServer;
  let bunser;

  beforeEach(() => {
    SocketServer = require('../SocketServer');

    const {EventEmitter} = require.requireActual('events');
    netServer = new EventEmitter();
    netServer.listen = jest.genMockFn();
    require('net').createServer.mockImpl(() => netServer);

    const bser = require('bser');
    bunser = new EventEmitter();
    bser.BunserBuf.mockImpl(() => bunser);
    bser.dumpToBuffer.mockImpl((a) => a);

    PackagerServer = require('../../Server');
  });

  pit('create a server', () => {
    const server = new SocketServer('/sock', { projectRoots: ['/root'] });
    netServer.emit('listening');
    return server.onReady().then(s => {
      expect(s).toBe(server);
      expect(netServer.listen).toBeCalledWith('/sock');
    });
  });

  pit('handles getDependencies message', () => {
    const server = new SocketServer('/sock', { projectRoots: ['/root'] });
    netServer.emit('listening');
    return server.onReady().then(() => {
      const sock = { on: jest.genMockFn(), write: jest.genMockFn() };
      netServer.emit('connection', sock);
      PackagerServer.prototype.getDependencies.mockImpl(
        () => Promise.resolve({ dependencies: ['a', 'b', 'c'] })
      );
      bunser.emit('value', { type: 'getDependencies', id: 1, data: '/main' });
      expect(PackagerServer.prototype.getDependencies).toBeCalledWith('/main');

      // Run pending promises.
      return Promise.resolve().then(() => {
        expect(sock.write).toBeCalledWith(
          { id: 1, type: 'result', data: ['a', 'b', 'c']}
        );
      });
    });
  });

  pit('handles buildBundle message', () => {
    const server = new SocketServer('/sock', { projectRoots: ['/root'] });
    netServer.emit('listening');
    return server.onReady().then(() => {
      const sock = { on: jest.genMockFn(), write: jest.genMockFn() };
      netServer.emit('connection', sock);
      PackagerServer.prototype.buildBundle.mockImpl(
        () => Promise.resolve({ bundle: 'foo' })
      );
      bunser.emit(
        'value',
        { type: 'buildBundle', id: 1, data: { options: 'bar' } }
      );
      expect(PackagerServer.prototype.buildBundle).toBeCalledWith(
        { options: 'bar' }
      );

      // Run pending promises.
      return Promise.resolve().then(() => {
        expect(sock.write).toBeCalledWith(
          { id: 1, type: 'result', data: { bundle: 'foo' }}
        );
      });
    });
  });
});

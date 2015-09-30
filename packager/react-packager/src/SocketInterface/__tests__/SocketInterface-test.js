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
    .mock('child_process')
    .dontMock('../');

var SocketInterface = require('../');
var SocketClient = require('../SocketClient');
var childProcess = require('child_process');
var fs = require('fs');

describe('SocketInterface', () => {
  describe('getOrCreateSocketFor', () => {
    pit('creates socket path by hashing options', () => {
      fs.existsSync = jest.genMockFn().mockImpl(() => true);
      fs.unlinkSync = jest.genMockFn();
      let callback;

      childProcess.spawn.mockImpl(() => ({
        on: (event, cb) => callback = cb,
        send: (message) => {
          setImmediate(() => callback({ type: 'createdServer' }));
        },
        unref: () => undefined,
        disconnect: () => undefined,
      }));

      // Check that given two equivelant server options, we end up with the same
      // socket path.
      const options1 = { projectRoots: ['/root'], transformModulePath: '/root/foo' };
      const options2 = { transformModulePath: '/root/foo', projectRoots: ['/root'] };
      const options3 = { projectRoots: ['/root', '/root2'] };

      return SocketInterface.getOrCreateSocketFor(options1).then(() => {
        expect(SocketClient.create).toBeCalled();
        return SocketInterface.getOrCreateSocketFor(options2).then(() => {
          expect(SocketClient.create.mock.calls.length).toBe(2);
          expect(SocketClient.create.mock.calls[0]).toEqual(SocketClient.create.mock.calls[1]);
          return SocketInterface.getOrCreateSocketFor(options3).then(() => {
            expect(SocketClient.create.mock.calls.length).toBe(3);
            expect(SocketClient.create.mock.calls[1]).not.toEqual(SocketClient.create.mock.calls[2]);
          });
        });
      });
    });

    pit('should fork a server', () => {
      fs.existsSync = jest.genMockFn().mockImpl(() => false);
      fs.unlinkSync = jest.genMockFn();
      let sockPath;
      let callback;

      childProcess.spawn.mockImpl(() => ({
        on: (event, cb) => callback = cb,
        send: (message) => {
          expect(message.type).toBe('createSocketServer');
          expect(message.data.options).toEqual({ projectRoots: ['/root'] });
          expect(message.data.sockPath).toContain('react-packager');
          sockPath = message.data.sockPath;

          setImmediate(() => callback({ type: 'createdServer' }));
        },
        unref: () => undefined,
        disconnect: () => undefined,
      }));

      return SocketInterface.getOrCreateSocketFor({ projectRoots: ['/root'] })
        .then(() => {
          expect(SocketClient.create).toBeCalledWith(sockPath);
        });
    });
  });
});

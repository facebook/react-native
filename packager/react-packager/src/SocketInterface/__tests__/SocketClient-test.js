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
    .dontMock('../SocketClient');

describe('SocketClient', () => {
  let SocketClient;
  let sock;
  let bunser;

  beforeEach(() => {
    SocketClient = require('../SocketClient');

    const {EventEmitter} = require.requireActual('events');
    sock = new EventEmitter();
    sock.write = jest.genMockFn();

    require('net').connect.mockImpl(() => sock);

    const bser = require('bser');
    bunser = new EventEmitter();
    require('bser').BunserBuf.mockImpl(() => bunser);
    bser.dumpToBuffer.mockImpl((a) => a);

    require('../../Bundler/Bundle').fromJSON.mockImpl((a) => a);
  });

  pit('create a connection', () => {
    const client = new SocketClient('/sock');
    sock.emit('connect');
    return client.onReady().then(c => {
      expect(c).toBe(client);
      expect(require('net').connect).toBeCalledWith('/sock');
    });
  });

  pit('buildBundle', () => {
    const client = new SocketClient('/sock');
    sock.emit('connect');
    const options = { entryFile: '/main' };

    const promise = client.buildBundle(options);

    expect(sock.write).toBeCalled();
    const message = sock.write.mock.calls[0][0];
    expect(message.type).toBe('buildBundle');
    expect(message.data).toEqual(options);
    expect(typeof message.id).toBe('string');

    bunser.emit('value', {
      id: message.id,
      type: 'result',
      data: { bundle: 'foo' },
    });

    return promise.then(bundle => expect(bundle).toEqual({ bundle: 'foo' }));
  });

  pit('getDependencies', () => {
    const client = new SocketClient('/sock');
    sock.emit('connect');
    const main = '/main';

    const promise = client.getDependencies(main);

    expect(sock.write).toBeCalled();
    const message = sock.write.mock.calls[0][0];
    expect(message.type).toBe('getDependencies');
    expect(message.data).toEqual(main);
    expect(typeof message.id).toBe('string');

    bunser.emit('value', {
      id: message.id,
      type: 'result',
      data: ['a', 'b', 'c'],
    });

    return promise.then(result => expect(result).toEqual(['a', 'b', 'c']));
  });

  pit('handle errors', () => {
    const client = new SocketClient('/sock');
    sock.emit('connect');
    const main = '/main';

    const promise = client.getDependencies(main);

    expect(sock.write).toBeCalled();
    const message = sock.write.mock.calls[0][0];
    expect(message.type).toBe('getDependencies');
    expect(message.data).toEqual(main);
    expect(typeof message.id).toBe('string');

    bunser.emit('value', {
      id: message.id,
      type: 'error',
      data: 'some error'
    });

    return promise.catch(m => expect(m.message).toBe('some error'));
  });
});

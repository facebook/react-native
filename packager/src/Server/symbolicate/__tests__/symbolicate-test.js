/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();
jest.mock('child_process');
jest.mock('net');

const EventEmitter = require('events');
const {Readable} = require('stream');
const {createWorker} = require('../');

let childProcess, socketResponse, socket, worker;

beforeEach(() => {
  childProcess = Object.assign(new EventEmitter(), {send: jest.fn()});
  require('child_process').fork.mockReturnValueOnce(childProcess);
  setupCommunication();

  socketResponse = '{"error": "no fake socket response set"}';
  socket = Object.assign(new Readable(), {
    _read() {
      this.push(socketResponse);
      this.push(null);
    },
    end: jest.fn(),
    setEncoding: jest.fn(),
  });
  require('net').createConnection.mockImplementation(() => socket);

  worker = createWorker();
});

it('sends a socket path to the child process', () => {
  socketResponse = '{}';
  return worker([], fakeSourceMaps())
    .then(() => expect(childProcess.send).toBeCalledWith(expect.any(String)));
});

it('fails if the child process emits an error', () => {
  const error = new Error('Expected error');
  childProcess.send.mockImplementation(() =>
    childProcess.emit('error', error));

  expect.assertions(1);
  return worker([], fakeSourceMaps())
    .catch(e => expect(e).toBe(error));
});

it('fails if the socket connection emits an error', () => {
  const error = new Error('Expected error');
  socket._read = () => socket.emit('error', error);

  expect.assertions(1);
  return worker([], fakeSourceMaps())
    .catch(e => expect(e).toBe(error));
});

it('sends the passed in stack and maps over the socket', () => {
  socketResponse = '{}';
  const stack = ['the', 'stack'];
  return worker(stack, fakeSourceMaps())
    .then(() =>
      expect(socket.end).toBeCalledWith(JSON.stringify({
        maps: Array.from(fakeSourceMaps()),
        stack,
      })));
});

it('resolves to the `result` property of the message returned over the socket', () => {
  socketResponse = '{"result": {"the": "result"}}';
  return worker([], fakeSourceMaps())
    .then(response => expect(response).toEqual({the: 'result'}));
});

it('rejects with the `error` property of the message returned over the socket', () => {
  socketResponse = '{"error": "the error message"}';

  expect.assertions(1);
  return worker([], fakeSourceMaps())
    .catch(error => expect(error).toEqual(new Error('the error message')));
});

it('rejects if the socket response cannot be parsed as JSON', () => {
  socketResponse = '{';

  expect.assertions(1);
  return worker([], fakeSourceMaps())
    .catch(error => expect(error).toBeInstanceOf(SyntaxError));
});

function setupCommunication() {
  childProcess.send.mockImplementation(() =>
    process.nextTick(() => childProcess.emit('message')));
}

function* fakeSourceMaps() {
  yield [1, {}];
  yield [2, {}];
}

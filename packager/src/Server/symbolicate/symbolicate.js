/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const concat = require('concat-stream');
const debug = require('debug')('RNP:Symbolication');
const net = require('net');
const temp = require('temp');
const xpipe = require('xpipe');

const {LazyPromise, LockingPromise} = require('./util');
const {fork} = require('child_process');

export type {SourceMap as SourceMap};
import type {MixedSourceMap as SourceMap} from '../../lib/SourceMap';

export type Stack = Array<{file: string, lineNumber: number, column: number}>;
export type Symbolicate =
  (Stack, Iterable<[string, SourceMap]>) => Promise<Stack>;

const affixes = {prefix: 'metro-bundler-symbolicate', suffix: '.sock'};
const childPath = require.resolve('./worker');

exports.createWorker = (): Symbolicate => {
  // There are issues with named sockets on windows that cause the connection to
  // close too early so run the symbolicate server on a random localhost port.
  const socket = process.platform === 'win32'
    ? 34712
    : xpipe.eq(temp.path(affixes));
  const child = new LockingPromise(new LazyPromise(() => startupChild(socket)));

  return (stack, sourceMaps) =>
    child
      .then(() => connectAndSendJob(socket, message(stack, sourceMaps)))
      .then(JSON.parse)
      .then(response =>
        'error' in response
          ? Promise.reject(new Error(response.error))
          : response.result
      );
};

function startupChild(socket) {
  const child = fork(childPath);
  return new Promise((resolve, reject) => {
    child
      .once('error', reject)
      .once('message', () => {
        child.removeAllListeners();
        resolve(child);
      });
    // $FlowFixMe ChildProcess.send should accept any type.
    child.send(socket);
  });
}

function connectAndSendJob(socket, data) {
  const job = new Promise((resolve, reject) => {
    debug('Connecting to worker');
    const connection = net.createConnection(socket);
    connection.setEncoding('utf8');
    connection.on('error', reject);
    connection.pipe(concat(resolve));
    debug('Sending data to worker');
    connection.end(data);
  });
  job.then(() => debug('Received response from worker'));
  return job;
}

function message(stack, sourceMaps) {
  return JSON.stringify({maps: Array.from(sourceMaps), stack});
}

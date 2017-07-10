/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 */

'use strict';

let spawnError = false;

jest.setMock('child_process', {
  spawn: () => ({
    on: (event, cb) => cb(spawnError),
  }),
});

const makeCommand = require('../makeCommand');

describe('makeCommand', () => {
  const command = makeCommand('echo');

  it('generates a function around shell command', () => {
    expect(typeof command).toBe('function');
  });

  it('throws an error if there is no callback provided', () => {
    expect(command).toThrow();
  });

  it('invokes a callback after command execution', () => {
    const spy = jest.fn();
    command(spy);
    expect(spy.mock.calls).toHaveLength(1);
  });

  it('throws an error if spawn ended up with error', () => {
    spawnError = true;
    const cb = jest.fn();
    expect(() => {
      command(cb);
    }).toThrow();
  });
});

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
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

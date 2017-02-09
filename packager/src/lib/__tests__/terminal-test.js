/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.dontMock('../terminal');

jest.mock('readline', () => ({
  moveCursor: (stream, dx, dy) => {
    const {cursor, columns} = stream;
    stream.cursor = Math.max(cursor - cursor % columns, cursor + dx) + dy * columns;
  },
  clearLine: (stream, dir) => {
    if (dir !== 0) {throw new Error('unsupported');}
    const {cursor, columns} = stream;
    const curLine = cursor - cursor % columns;
    const nextLine = curLine + columns;
    for (var i = curLine; i < nextLine; ++i) {
      stream.buffer[i] = ' ';
    }
  },
}));

describe('terminal', () => {

  beforeEach(() => {
    jest.resetModules();
  });

  function prepare(isTTY) {
    const {Terminal} = require('../terminal');
    const lines = 10;
    const columns = 10;
    const stream = Object.create(
      isTTY ? require('tty').WriteStream.prototype : require('net').Socket,
    );
    Object.assign(stream, {
      cursor: 0,
      buffer: ' '.repeat(columns * lines).split(''),
      columns,
      lines,
      write(str) {
        for (let i = 0; i < str.length; ++i) {
          if (str[i] === '\n') {
            this.cursor = this.cursor - (this.cursor % columns) + columns;
          } else {
            this.buffer[this.cursor] = str[i];
            ++this.cursor;
          }
        }
      },
    });
    return {stream, terminal: new Terminal(stream)};
  }

  it('is not printing status to non-interactive terminal', () => {
    const {stream, terminal} = prepare(false);
    terminal.log('foo %s', 'smth');
    terminal.status('status');
    terminal.log('bar');
    expect(stream.buffer.join('').trim())
      .toEqual('foo smth  bar');
  });

  it('updates status when logging, single line', () => {
    const {stream, terminal} = prepare(true);
    terminal.log('foo');
    terminal.status('status');
    terminal.status('status2');
    terminal.log('bar');
    expect(stream.buffer.join('').trim())
      .toEqual('foo       bar       status2');
  });

  it('updates status when logging, multi-line', () => {
    const {stream, terminal} = prepare(true);
    terminal.log('foo');
    terminal.status('status\nanother');
    terminal.log('bar');
    expect(stream.buffer.join('').trim())
      .toEqual('foo       bar       status    another');
  });

  it('persists status', () => {
    const {stream, terminal} = prepare(true);
    terminal.log('foo');
    terminal.status('status');
    terminal.persistStatus();
    terminal.log('bar');
    expect(stream.buffer.join('').trim())
      .toEqual('foo       status    bar');
  });

});

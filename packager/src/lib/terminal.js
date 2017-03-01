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

const readline = require('readline');
const tty = require('tty');
const util = require('util');

/**
 * Clear some text that was previously printed on an interactive stream,
 * without trailing newline character (so we have to move back to the
 * beginning of the line).
 */
function clearStringBackwards(stream: tty.WriteStream, str: string): void {
  readline.moveCursor(stream, -stream.columns, 0);
  readline.clearLine(stream, 0);
  let lineCount = (str.match(/\n/g) || []).length;
  while (lineCount > 0) {
    readline.moveCursor(stream, 0, -1);
    readline.clearLine(stream, 0);
    --lineCount;
  }
}

/**
 * Cut a string into an array of string of the specific maximum size. A newline
 * ends a chunk immediately (it's not included in the "." RexExp operator), and
 * is not included in the result.
 */
function chunkString(str: string, size: number): Array<string> {
  return str.match(new RegExp(`.{1,${size}}`, 'g')) || [];
}

/**
 * We don't just print things to the console, sometimes we also want to show
 * and update progress. This utility just ensures the output stays neat: no
 * missing newlines, no mangled log lines.
 *
 *     const terminal = Terminal.default;
 *     terminal.status('Updating... 38%');
 *     terminal.log('warning: Something happened.');
 *     terminal.status('Updating, done.');
 *     terminal.persistStatus();
 *
 * The final output:
 *
 *     warning: Something happened.
 *     Updating, done.
 *
 * Without the status feature, we may get a mangled output:
 *
 *     Updating... 38%warning: Something happened.
 *     Updating, done.
 *
 * This is meant to be user-readable and TTY-oriented. We use stdout by default
 * because it's more about status information than diagnostics/errors (stderr).
 *
 * Do not add any higher-level functionality in this class such as "warning" and
 * "error" printers, as it is not meant for formatting/reporting. It has the
 * single responsibility of handling status messages.
 */
class Terminal {

  _statusStr: string;
  _stream: net$Socket;

  constructor(stream: net$Socket) {
    this._stream = stream;
    this._statusStr = '';
  }

  /**
   * Same as status() without the formatting capabilities. We just clear and
   * rewrite with the new status. If the stream is non-interactive we still
   * keep track of the string so that `persistStatus` works.
   */
  _setStatus(str: string): string {
    const {_statusStr, _stream} = this;
    if (_statusStr !== str && _stream instanceof tty.WriteStream) {
      clearStringBackwards(_stream, _statusStr);
      str = chunkString(str, _stream.columns).join('\n');
      _stream.write(str);
    }
    this._statusStr = str;
    return _statusStr;
  }

  /**
   * Shows some text that is meant to be overriden later. Return the previous
   * status that was shown and is no more. Calling `status()` with no argument
   * removes the status altogether. The status is never shown in a
   * non-interactive terminal: for example, if the output is redirected to a
   * file, then we don't care too much about having a progress bar.
   */
  status(format: string, ...args: Array<mixed>): string {
    return this._setStatus(util.format(format, ...args));
  }

  /**
   * Similar to `console.log`, except it moves the status/progress text out of
   * the way correctly. In non-interactive terminals this is the same as
   * `console.log`.
   */
  log(format: string, ...args: Array<mixed>): void {
    const oldStatus = this._setStatus('');
    this._stream.write(util.format(format, ...args) + '\n');
    this._setStatus(oldStatus);
  }

  /**
   * Log the current status and start from scratch. This is useful if the last
   * status was the last one of a series of updates.
   */
  persistStatus(): void {
    return this.log(this.status(''));
  }

}

/**
 * On the same pattern as node.js `console` module, we export the stdout-based
 * terminal at the top-level, but provide access to the Terminal class as a
 * field (so it can be used, for instance, with stderr).
 */
class GlobalTerminal extends Terminal {

  Terminal: Class<Terminal>;

  constructor() {
    /* $FlowFixMe: Flow is wrong, Node.js docs specify that process.stdout is an
     * instance of a net.Socket (a local socket, not network). */
    super(process.stdout);
    this.Terminal = Terminal;
  }

}

module.exports = new GlobalTerminal();

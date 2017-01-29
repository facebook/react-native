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

const encode = require('./encode');

const MAX_SEGMENT_LENGTH = 7;
const ONE_MEG = 1024 * 1024;
const COMMA = 0x2c;
const SEMICOLON = 0x3b;

/**
 * Efficient builder for base64 VLQ mappings strings.
 *
 * This class uses a buffer that is preallocated with one megabyte and is
 * reallocated dynamically as needed, doubling its size.
 *
 * Encoding never creates any complex value types (strings, objects), and only
 * writes character values to the buffer.
 *
 * For details about source map terminology and specification, check
 * https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit
 */
class B64Builder {
  buffer: Buffer;
  pos: number;
  hasSegment: boolean;

  constructor() {
    this.buffer = new Buffer(ONE_MEG);
    this.pos = 0;
    this.hasSegment = false;
  }

  /**
   * Adds `n` markers for generated lines to the mappings.
   */
  markLines(n: number) {
    if (n < 1) {
      return this;
    }
    this.hasSegment = false;
    if (this.pos + n >= this.buffer.length) {
      this._realloc();
    }
    while (n--) {
      this.buffer[this.pos++] = SEMICOLON;
    }
    return this;
  }

  /**
   * Starts a segment at the specified column offset in the current line.
   */
  startSegment(column: number) {
    if (this.hasSegment) {
      this._writeByte(COMMA);
    } else {
      this.hasSegment = true;
    }

    this.append(column);
    return this;
  }

  /**
   * Appends a single number to the mappings.
   */
  append(value: number) {
    if (this.pos + MAX_SEGMENT_LENGTH >= this.buffer.length) {
      this._realloc();
    }

    this.pos = encode(value, this.buffer, this.pos);
    return this;
  }

  /**
   * Returns the string representation of the mappings.
   */
  toString() {
    return this.buffer.toString('ascii', 0, this.pos);
  }

  _writeByte(byte) {
    if (this.pos === this.buffer.length) {
      this._realloc();
    }
    this.buffer[this.pos++] = byte;
  }

  _realloc() {
    const {buffer} = this;
    this.buffer = new Buffer(buffer.length * 2);
    buffer.copy(this.buffer);
  }
}

module.exports = B64Builder;

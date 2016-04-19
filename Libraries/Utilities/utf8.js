/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule utf8
 * @flow
 */
'use strict';

class ByteVector {
  _storage: Uint8Array;
  _sizeWritten: number;

  constructor(size) {
    this._storage = new Uint8Array(size);
    this._sizeWritten = 0;
  }

  push(value: number): ByteVector {
    const i = this._sizeWritten;
    if (i === this._storage.length) {
      this._realloc();
    }
    this._storage[i] = value;
    this._sizeWritten = i + 1;
    return this;
  }

  getBuffer(): ArrayBuffer {
    return this._storage.buffer.slice(0, this._sizeWritten);
  }

  _realloc() {
    const storage = this._storage;
    this._storage = new Uint8Array(align(storage.length * 1.5));
    this._storage.set(storage);
  }
}

/*eslint-disable no-bitwise */
exports.encode = (string: string): ArrayBuffer => {
  const {length} = string;
  const bytes = new ByteVector(length);

  // each character / char code is assumed to represent an UTF-16 wchar.
  // With the notable exception of surrogate pairs, each wchar represents the
  // corresponding unicode code point.
  // For an explanation of UTF-8 encoding, read [1]
  // For an explanation of UTF-16 surrogate pairs, read [2]
  //
  // [1] https://en.wikipedia.org/wiki/UTF-8#Description
  // [2] https://en.wikipedia.org/wiki/UTF-16#U.2B10000_to_U.2B10FFFF
  let nextCodePoint = string.charCodeAt(0);
  for (let i = 0; i < length; i++) {
    let codePoint = nextCodePoint;
    nextCodePoint = string.charCodeAt(i + 1);

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes
        .push(0xc0 | codePoint >>> 6)
        .push(0x80 | codePoint & 0x3f);
    } else if (codePoint >>> 10 === 0x36 && nextCodePoint >>> 10 === 0x37) { // high surrogate & low surrogate
      codePoint = 0x10000 + (((codePoint & 0x3ff) << 10) | (nextCodePoint & 0x3ff));
      bytes
        .push(0xf0 | codePoint >>> 18 & 0x7)
        .push(0x80 | codePoint >>> 12 & 0x3f)
        .push(0x80 | codePoint >>> 6  & 0x3f)
        .push(0x80 | codePoint & 0x3f);

      i += 1;
      nextCodePoint = string.charCodeAt(i + 1);
    } else {
      bytes
        .push(0xe0 | codePoint >>> 12)
        .push(0x80 | codePoint >>> 6 & 0x3f)
        .push(0x80 | codePoint & 0x3f);
    }
  }
  return bytes.getBuffer();
};

// align to multiples of 8 bytes
function align(size: number): number {
  return size % 8 ? (Math.floor(size / 8) + 1) << 3 : size;
}

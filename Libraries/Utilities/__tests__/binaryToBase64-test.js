/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const base64 = require('base64-js');
const {TextDecoder, TextEncoder} = require('util');

describe('binaryToBase64', () => {
  const binaryToBase64 = require('../binaryToBase64');

  it('should encode a Uint8Array', () => {
    const input = new TextEncoder().encode('Test string');

    expect(base64ToString(binaryToBase64(input))).toEqual('Test string');
  });

  it('should encode an ArrayBuffer', () => {
    const input = new TextEncoder().encode('Test string').buffer;

    expect(base64ToString(binaryToBase64(input))).toEqual('Test string');
  });

  it('should encode a DataView', () => {
    const input = new DataView(new TextEncoder().encode('Test string').buffer);

    expect(base64ToString(binaryToBase64(input))).toEqual('Test string');
  });

  it('should not encode a non ArrayBuffer or non typed array', () => {
    const input = ['i', 'n', 'v', 'a', 'l', 'i', 'd'];

    expect(() => binaryToBase64(input)).toThrowError();
  });
});

function base64ToString(base64String) {
  const byteArray = base64.toByteArray(base64String);

  return new TextDecoder().decode(byteArray);
}

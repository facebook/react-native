/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import binaryToBase64 from '../binaryToBase64';
import base64 from 'base64-js';
import {TextDecoder, TextEncoder} from 'util';

describe('binaryToBase64', () => {
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

  it('should not encode a non-ArrayBuffer or non-TypedArray', () => {
    const input = ['i', 'n', 'v', 'a', 'l', 'i', 'd'];

    // $FlowExpectedError[incompatible-call]
    expect(() => binaryToBase64(input)).toThrowError();
  });
});

function base64ToString(base64String: string) {
  const byteArray = base64.toByteArray(base64String);

  // $FlowFixMe[incompatible-call] - `TextEncoder` constructor type is wrong.
  return new TextDecoder().decode(byteArray);
}

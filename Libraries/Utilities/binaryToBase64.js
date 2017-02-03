/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule binaryToBase64
 * @flow
 */
'use strict';

const base64 = require('base64-js');

function binaryToBase64(data: ArrayBuffer | $ArrayBufferView) {
  if (data instanceof ArrayBuffer) {
    data = new Uint8Array(data);
  }
  if (data instanceof Uint8Array) {
    return base64.fromByteArray(data);
  }
  if (!ArrayBuffer.isView(data)) {
    throw new Error('data must be ArrayBuffer or typed array');
  }
  const {buffer, byteOffset, byteLength} = data;
  return base64.fromByteArray(new Uint8Array(buffer, byteOffset, byteLength));
}

module.exports = binaryToBase64;

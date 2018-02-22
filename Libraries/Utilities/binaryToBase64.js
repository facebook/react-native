/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule binaryToBase64
 * @flow
 */
'use strict';

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const base64 = require('base64-js');

function binaryToBase64(data: ArrayBuffer | $ArrayBufferView) {
  let dataBuffer = data;
  if (dataBuffer instanceof ArrayBuffer) {
    dataBuffer = new Uint8Array(dataBuffer);
  }
  if (dataBuffer instanceof Uint8Array) {
    return base64.fromByteArray(dataBuffer);
  }
  if (!ArrayBuffer.isView(dataBuffer)) {
    throw new Error('data must be ArrayBuffer or typed array');
  }
  const {buffer, byteOffset, byteLength} = dataBuffer;
  return base64.fromByteArray(new Uint8Array(buffer, byteOffset, byteLength));
}

module.exports = binaryToBase64;

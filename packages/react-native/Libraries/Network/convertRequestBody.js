/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const Blob = require('../Blob/Blob');
const binaryToBase64 = require('../Utilities/binaryToBase64');
const FormData = require('./FormData');

export type RequestBody =
  | string
  | Blob
  | FormData
  | {uri: string, ...}
  | ArrayBuffer
  | $ArrayBufferView;

function convertRequestBody(body: RequestBody): Object {
  if (typeof body === 'string') {
    return {string: body};
  }
  if (body instanceof Blob) {
    return {blob: body.data};
  }
  if (body instanceof FormData) {
    return {formData: body.getParts()};
  }
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    /* $FlowFixMe[incompatible-call] : no way to assert that 'body' is indeed
     * an ArrayBufferView */
    return {base64: binaryToBase64(body)};
  }
  return body;
}

module.exports = convertRequestBody;

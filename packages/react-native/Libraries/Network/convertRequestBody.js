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

import typeof BlobT from '../Blob/Blob';
import typeof FormDataT from './FormData';

const Blob: BlobT = require('../Blob/Blob').default;
const binaryToBase64 = require('../Utilities/binaryToBase64').default;
const FormData: FormDataT = require('./FormData').default;

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

export default convertRequestBody;

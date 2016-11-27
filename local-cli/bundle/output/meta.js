/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

/* global Buffer: true */

const crypto = require('crypto');

const isUTF8 = encoding => /^utf-?8$/i.test(encoding);

const constantFor = encoding =>
  /^ascii$/i.test(encoding) ? 1 :
  isUTF8(encoding) ? 2 :
  /^(?:utf-?16(?:le)?|ucs-?2)$/.test(encoding) ? 3 : 0;

module.exports = function(code, encoding) {
  const hash = crypto.createHash('sha1');
  hash.update(code, encoding);
  const digest = hash.digest('binary');
  const signature = Buffer.alloc ? Buffer.alloc(digest.length + 1) : new Buffer(digest.length + 1); // remove the new Buffer call when RN drops support for Node 4
  signature.write(digest, 'binary');
  signature.writeUInt8(
    constantFor(tryAsciiPromotion(code, encoding)),
    signature.length - 1);
  return signature;
};

function tryAsciiPromotion(string, encoding) {
  if (!isUTF8(encoding)) { return encoding; }
  for (let i = 0, n = string.length; i < n; i++) {
    if (string.charCodeAt(i) > 0x7f) { return encoding; }
  }
  return 'ascii';
}

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const crypto = require('crypto');

const createHash = () => crypto.createHash('sha1');
const isUTF8 = encoding => /^utf-?8$/i.test(encoding);

exports.appendToString = (string, encoding) => {
  const hash = createHash();
  hash.update(string, encoding);
  encoding = tryAsciiPromotion(string, encoding);
  return string + formatSignature(encoding, hash);
};

function tryAsciiPromotion(string, encoding) {
  if (!isUTF8(encoding)) { return encoding; }
  for (let i = 0, n = string.length; i < n; i++) {
    if (string.charCodeAt(i) > 0x7f) { return encoding; }
  }
  return 'ascii';
}

function formatSignature(encoding, hash) {
  return `/*${encoding}:${hash.digest('hex')}*/`;
}

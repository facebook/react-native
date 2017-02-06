/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const imurmurhash = require('imurmurhash');
const jsonStableStringify = require('json-stable-stringify');

const transformCache = new Map();

const mock = {
  lastWrite: null,
  reset() {
    transformCache.clear();
    mock.lastWrite = null;
  },
};

const transformCacheKeyOf = (props) =>
  props.filePath + '-' + imurmurhash(props.sourceCode)
    .hash(props.transformCacheKey)
    .hash(jsonStableStringify(props.transformOptions || {}))
    .result().toString(16);

function writeSync(props) {
  transformCache.set(transformCacheKeyOf(props), props.result);
  mock.lastWrite = props;
}

function readSync(props) {
  return transformCache.get(transformCacheKeyOf(props));
}

module.exports = {
  writeSync,
  readSync,
  mock,
};

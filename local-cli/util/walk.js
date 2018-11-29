/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fs = require('fs');
const path = require('path');

function walk(current) {
  if (!fs.lstatSync(current).isDirectory()) {
    return [current];
  }

  const files = fs.readdirSync(current).map(child => {
    child = path.join(current, child);
    return walk(child);
  });
  return [].concat.apply([current], files);
}

module.exports = walk;

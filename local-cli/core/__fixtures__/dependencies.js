/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = jest.requireActual('fs');
const path = require('path');
const android = require('./android');

const pjson = fs.readFileSync(path.join(__dirname, 'files', 'package.json'));

module.exports = {
  valid: {
    'package.json': pjson,
    android: android.valid,
  },
  withAssets: {
    'package.json': pjson,
    android: android.valid,
    fonts: {
      'A.ttf': '',
      'B.ttf': '',
    },
    images: {
      'C.jpg': '',
    },
  },
  noPackage: {
    'package.json': pjson,
    android: android.noPackage,
  },
};

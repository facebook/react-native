/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version) {
  console.error('Please provide a react-native version.');
  process.exit(1);
}

const jsonPath = path.join(__dirname, '../template/package.json');

let templatePackageJson = require(jsonPath);
templatePackageJson.dependencies['react-native'] = version;
fs.writeFileSync(
  jsonPath,
  JSON.stringify(templatePackageJson, null, 2) + '\n',
  'utf-8',
);

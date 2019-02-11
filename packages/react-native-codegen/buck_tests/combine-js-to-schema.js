/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const fs = require('fs');

const args = process.argv.slice(2);
if (args.length !== 2) {
  throw new Error(
    'Expected to receive the input path and output path as arguments',
  );
}

const src = args[0];
const outputPath = args[1];

let file;

try {
  // Eventually this will be replaced with a script that reads and parses
  // the file via ast
  // $FlowFixMe Can't require dynamic variables
  file = require(src);
} catch (err) {
  throw new Error(`Can't require file at ${src}`);
}

fs.writeFileSync(outputPath, JSON.stringify(file, null, 2));

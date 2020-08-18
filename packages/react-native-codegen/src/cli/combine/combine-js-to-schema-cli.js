/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @flow strict-local
 * @format
 */

'use strict';

const combine = require('./combine-js-to-schema');
const fs = require('fs');

const [outfile, ...fileList] = process.argv.slice(2);

const formattedSchema = JSON.stringify(combine(fileList), null, 2);
if (outfile != null) {
  fs.writeFileSync(outfile, formattedSchema);
} else {
  console.log(formattedSchema);
}

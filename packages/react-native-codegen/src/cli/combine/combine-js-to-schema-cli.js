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
// $FlowFixMe[untyped-import] glob is untyped
const glob = require('glob');
const path = require('path');

const [outfile, ...fileList] = process.argv.slice(2);

const allFiles = [];
fileList.forEach(file => {
  if (fs.lstatSync(file).isDirectory()) {
    const dirFiles = glob
      .sync(`${file}/**/*.js`, {
        nodir: true,
      })
      .filter(
        f =>
          /^(Native.+|.+NativeComponent)/.test(path.basename(f)) &&
          // NativeUIManager will be deprecated by Fabric UIManager.
          // For now, ignore this spec completely because the types are not fully supported.
          !f.endsWith('NativeUIManager.js') &&
          !f.includes('__tests'),
      );
    allFiles.push(...dirFiles);
  } else {
    allFiles.push(file);
  }
});

const formattedSchema = JSON.stringify(combine(allFiles), null, 2);
if (outfile != null) {
  fs.writeFileSync(outfile, formattedSchema);
} else {
  console.log(formattedSchema);
}

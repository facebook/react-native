/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
const glob = require('glob');
const path = require('path');

const [outfile, ...fileList] = process.argv.slice(2);

function filterJSFile(file: string) {
  return (
    /^(Native.+|.+NativeComponent)/.test(path.basename(file)) &&
    // NativeUIManager will be deprecated by Fabric UIManager.
    // For now, ignore this spec completely because the types are not fully supported.
    !file.endsWith('NativeUIManager.js') &&
    // NativeSampleTurboModule is for demo purpose. It should be added manually to the
    // app for now.
    !file.endsWith('NativeSampleTurboModule.js') &&
    !file.includes('__tests')
  );
}

const allFiles = [];
fileList.forEach(file => {
  if (fs.lstatSync(file).isDirectory()) {
    const dirFiles = glob
      .sync(`${file}/**/*.{js,ts,tsx}`, {
        nodir: true,
      })
      .filter(filterJSFile);
    allFiles.push(...dirFiles);
  } else if (filterJSFile(file)) {
    allFiles.push(file);
  }
});

const combined = combine(allFiles);

// Warn users if there is no modules to process
if (Object.keys(combined.modules).length === 0) {
  console.error(
    'No modules to process in combine-js-to-schema-cli. If this is unexpected, please check if you set up your NativeComponent correctly. See combine-js-to-schema.js for how codegen finds modules.',
  );
}
const formattedSchema = JSON.stringify(combined, null, 2);

if (outfile != null) {
  fs.writeFileSync(outfile, formattedSchema);
} else {
  console.log(formattedSchema);
}

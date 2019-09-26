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

const RNCodegen = require('../src/generators/RNCodegen.js');
const RNParser = require('../src/generators/RNParser.js');

const path = require('path');

type Result = $ReadOnly<{|
  libraryName: string,
  success: boolean,
|}>;

function generateFilesWithResults(
  files: Array<string>,
  test: boolean,
): Array<Result> {
  return files.reduce((aggregated, filename) => {
    const schema = RNParser.parse(filename);
    if (schema && schema.modules) {
      const libraryName = path.basename(filename).replace('Schema.js', '');
      const success = RNCodegen.generate(
        {
          schema,
          libraryName,
          outputDirectory: path.dirname(filename),
        },
        {generators: ['view-configs'], test},
      );

      aggregated.push({
        libraryName,
        success,
      });
    }
    return aggregated;
  }, []);
}

function generate(files: Array<string>, test: boolean): void {
  console.log(`${test ? 'Testing' : 'Generating'} view configs`);

  const results = generateFilesWithResults(files, test);

  const failed = results.filter(result => !result.success);
  const totalCount = results.length;

  console.log(`\n${test ? 'Tested' : 'Generated'} ${totalCount} view configs`);

  if (failed.length) {
    if (test === true) {
      console.error(`${failed.length} configs changed`);
      console.error("Please re-run 'js1 build viewconfigs'");
    }
    process.exit(1);
  }
}

module.exports = generate;

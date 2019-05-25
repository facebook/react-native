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

const RNCodegen = require('../../generators/RNCodegen.js');
const SchemaParser = require('../../parsers/schema');
const FlowParser = require('../../parsers/flow');

const path = require('path');

type Result = $ReadOnly<{|
  libraryName: string,
  success: boolean,
|}>;

type Config = $ReadOnly<{|
  test?: boolean,
  parser?: 'schema' | 'flow',
|}>;

function generateFilesWithResults(
  files: Array<string>,
  config: Config,
): Array<Result> {
  return files.reduce((aggregated, filename) => {
    const schema =
      config.parser === 'flow'
        ? FlowParser.parse(filename)
        : SchemaParser.parse(filename);
    if (schema && schema.modules) {
      const libraryName = path
        .basename(filename)
        .replace(/NativeComponent\.js$/, '');
      const success = RNCodegen.generate(
        {
          schema,
          libraryName,
          outputDirectory: path.dirname(filename),
        },
        {generators: ['view-configs'], test: config.test},
      );

      aggregated.push({
        libraryName,
        success,
      });
    }
    return aggregated;
  }, []);
}

function generate(files: Array<string>, config: Config): void {
  console.log(`${config.test ? 'Testing' : 'Generating'} view configs`);

  const results = generateFilesWithResults(files, config);

  const failed = results.filter(result => !result.success);
  const totalCount = results.length;

  console.log(
    `\n${config.test ? 'Tested' : 'Generated'} ${totalCount} view configs`,
  );

  if (failed.length) {
    if (config.test === true) {
      console.error(`${failed.length} configs changed`);
      console.error("Please re-run 'js1 build viewconfigs'");
    }
    process.exit(1);
  }
}

module.exports = generate;

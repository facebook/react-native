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

function generate(files: Array<string>): void {
  files.forEach(filename => {
    const schema = RNParser.parse(filename);
    if (schema && schema.modules) {
      RNCodegen.generate(
        {
          schema,
          outputDirectory: path.dirname(filename),
          libraryName: path.basename(filename).replace('Schema.js', ''),
        },
        {generators: ['view-configs']},
      );
    }
  });
}

module.exports = generate;

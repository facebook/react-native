/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const path = require('path');
const fs = require('fs');
const glob = require('glob');
const RNCodegen = require('react-native-codegen/lib/generators/RNCodegen');
const combine = require('react-native-codegen/lib/cli/combine/combine-js-to-schema');

function generate(schema, outputDirectory) {
  fs.mkdirSync(outputDirectory, {recursive: true});

  RNCodegen.generate(
    {
      libraryName: 'rncore',
      schema,
      outputDirectory,
    },
    {generators: ['descriptors', 'events', 'props', 'shadow-nodes']},
  );
}

function main() {
  const rnDir = path.resolve(__dirname, '..');
  const outputDirectory = path.resolve(
    rnDir,
    'ReactCommon',
    'react',
    'renderer',
    'components',
    'rncore',
  );

  const files = glob.sync('Libraries/**/*NativeComponent.js', {
    cwd: path.resolve(__dirname, '..'),
  });

  const schema = combine(
    files.map(file => path.resolve(__dirname, '..', file)),
  );

  generate(schema, outputDirectory);
}

main();

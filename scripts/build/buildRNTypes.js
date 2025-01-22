/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const {PACKAGES_DIR} = require('../consts');
const translate = require('flow-api-translator');
const {promises: fs} = require('fs');
const glob = require('glob');
const path = require('path');

const TYPES_DIR = 'new-types';
const PACKAGE_NAME = 'react-native';

// Start with Animated only as it using the export syntax.
const PATHS = ['Libraries/Animated'];

async function buildRNTypes() {
  const files = PATHS.flatMap(src_path =>
    glob.sync(path.resolve(PACKAGES_DIR, PACKAGE_NAME, src_path, '**/*.js'), {
      nodir: true,
    }),
  );

  console.log('Building RN types...');
  for (const file of files) {
    // Don't build tests
    if (/(\/__tests__\/|\/__mocks__\/)/.test(file)) {
      continue;
    }

    const buildPath = getBuildPath(file);
    const source = await fs.readFile(file, 'utf-8');
    const prettierConfig = {parser: 'babel'};

    await fs.mkdir(path.dirname(buildPath), {recursive: true});

    try {
      const typescriptDef = await translate.translateFlowToTSDef(
        source,
        prettierConfig,
      );

      if (
        /Unsupported feature: Translating ".*" is currently not supported/.test(
          typescriptDef,
        )
      ) {
        throw new Error(
          'Syntax unsupported by flow-api-translator used in ' + file,
        );
      }

      await fs.writeFile(buildPath, typescriptDef);
    } catch (e) {
      console.error(`Failed to build ${file.replace(PACKAGES_DIR, '')}`);
    }
  }
}

function getBuildPath(file /*: string */) /*: string */ {
  const packageDir = path.join(PACKAGES_DIR, PACKAGE_NAME);

  return path.join(
    packageDir,
    file
      .replace(packageDir, TYPES_DIR)
      .replace(/\.flow\.js$/, '.js')
      .replace(/\.js$/, '.d.ts'),
  );
}

module.exports = buildRNTypes;

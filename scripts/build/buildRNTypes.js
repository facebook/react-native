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
const {existsSync, promises: fs} = require('fs');
const glob = require('glob');
const path = require('path');

const TYPES_DIR = 'new-types';
const TYPES_OVERRIDE_DIR = 'types-override';
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
    if (/\/__tests__\//.test(file)) {
      continue;
    }

    const outputPath = getBuildPath(file);

    await fs.mkdir(path.dirname(outputPath), {recursive: true});

    // There are cases where flow-api-translator generates valid but incorrect types. In these cases,
    // it's possible to manually create a type definition that is correct to override the generated one.
    // If the override exists, use it. Otherwise, build the type definitions.
    if (shouldOverride(file)) {
      await overrideTypeDefinitions(file, outputPath);
    } else {
      await buildTypeDefinitions(file, outputPath);
    }
  }
}

async function overrideTypeDefinitions(
  file /*: string */,
  outputPath /*: string */,
) {
  const overridePath = getOverridePath(file);
  await fs.copyFile(overridePath, outputPath);
}

async function buildTypeDefinitions(
  file /*: string */,
  outputPath /*: string */,
) {
  const source = await fs.readFile(file, 'utf-8');
  const prettierConfig = {parser: 'babel'};

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

    await fs.writeFile(outputPath, typescriptDef);
  } catch (e) {
    console.error(`Failed to build ${file.replace(PACKAGES_DIR, '')}`);
  }
}

function getRNRelativePath(file /*: string */) /*: string */ {
  const packageDir = path.join(PACKAGES_DIR, PACKAGE_NAME);
  return file.replace(packageDir, '');
}

function getBuildPath(file /*: string */) /*: string */ {
  const relativePath = getRNRelativePath(file);
  return path.join(
    PACKAGES_DIR,
    PACKAGE_NAME,
    TYPES_DIR,
    relativePath.replace(/\.flow\.js$/, '.js').replace(/\.js$/, '.d.ts'),
  );
}

function getOverridePath(file /*: string */) /*: string */ {
  const relativePath = getRNRelativePath(file);
  return path.join(
    PACKAGES_DIR,
    PACKAGE_NAME,
    TYPES_OVERRIDE_DIR,
    relativePath.replace(/\.flow\.js$/, '.js').replace(/\.js$/, '.d.ts'),
  );
}

function shouldOverride(file /*: string */) /*: boolean */ {
  return existsSync(getOverridePath(file));
}

module.exports = buildRNTypes;

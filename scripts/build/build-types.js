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

const {PACKAGES_DIR, REPO_ROOT} = require('../consts');
const translateSourceFile = require('./build-types/translateSourceFile');
const chalk = require('chalk');
const {promises: fs} = require('fs');
const glob = require('glob');
const micromatch = require('micromatch');
const path = require('path');
const {parseArgs} = require('util');

const TYPES_DIR = 'types_generated';
const IGNORE_PATTERN = '**/__{tests,mocks,fixtures}__/**';

// Files matching these patterns will be translated to TypeScript
const SOURCE_PATTERNS = [
  // Start with Animated only
  'react-native/Libraries/Animated/**/*.js',
  // TODO(T210505412): Include input packages, e.g. virtualized-lists
];

// Files matching these patterns will not be translated to TypeScript,
// instead their explicit TypeScript definitions will be copied over
const SUBPATH_OVERRIDES /*: Record<string, $ReadOnlyArray<string>>*/ = {
  '**/react-native/Libraries/Animated/**/*.js': [
    'react-native/Libraries/Animated/*.d.ts',
  ],
};

const config = {
  options: {
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    values: {help},
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/build/build-types.js

  [Experimental] Build generated TypeScript types for react-native.
    `);
    process.exitCode = 0;
    return;
  }

  const files = SOURCE_PATTERNS.flatMap(srcPath =>
    glob.sync(path.join(PACKAGES_DIR, srcPath), {
      nodir: true,
    }),
  );

  console.log(
    '\n' +
      chalk.bold.inverse.yellow(
        'EXPERIMENTAL - Building generated react-native package types',
      ) +
      '\n',
  );

  const subpathsToOverride = Object.keys(SUBPATH_OVERRIDES);

  await Promise.all(
    files.map(async file => {
      // Ignore files that are explicitly excluded and those with the explicitly defined types
      if (
        micromatch.isMatch(file, IGNORE_PATTERN) ||
        subpathsToOverride.some(subpath => micromatch.isMatch(file, subpath))
      ) {
        return;
      }

      const buildPath = getBuildPath(file);
      const source = await fs.readFile(file, 'utf-8');
      await fs.mkdir(path.dirname(buildPath), {recursive: true});

      try {
        const typescriptDef = await translateSourceFile(source);

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
        console.error(`Failed to build ${path.relative(REPO_ROOT, file)}`);
      }
    }),
  );

  const typeDefinitions = Object.values(SUBPATH_OVERRIDES)
    .flatMap(typePaths => typePaths)
    .flatMap(srcPath =>
      glob.sync(path.join(PACKAGES_DIR, srcPath), {nodir: true}),
    );

  await Promise.all(
    typeDefinitions.map(async file => {
      const buildPath = getBuildPath(file);
      const source = await fs.readFile(file, 'utf-8');
      await fs.mkdir(path.dirname(buildPath), {recursive: true});
      await fs.writeFile(buildPath, source);
    }),
  );
}

function getPackageName(file /*: string */) /*: string */ {
  return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file /*: string */) /*: string */ {
  const packageDir = path.join(PACKAGES_DIR, getPackageName(file));

  return path.join(
    packageDir,
    file
      .replace(packageDir, TYPES_DIR)
      .replace(/\.flow\.js$/, '.js')
      .replace(/\.js$/, '.d.ts'),
  );
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}

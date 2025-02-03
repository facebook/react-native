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

require('../babel-register').registerForScript();

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

const SOURCE_PATTERNS = [
  // Start with Animated only
  'react-native/Libraries/Alert/**/*.js',
  'react-native/Libraries/ActionSheetIOS/**/*.js',
  'react-native/Libraries/TurboModule/RCTExport.js',
  'react-native/Libraries/Types/RootTagTypes.js',
  'react-native/Libraries/ReactNative/RootTag.js',
  'react-native/Libraries/Utilities/Platform.js',
  'react-native/src/private/specs_DEPRECATED/modules/NativeAlertManager.js',
  'react-native/src/private/specs_DEPRECATED/modules/NativeActionSheetManager.js',
  // TODO(T210505412): Include input packages, e.g. virtualized-lists
];

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

  const files = ignoreShadowedFiles(
    SOURCE_PATTERNS.flatMap(srcPath =>
      glob.sync(path.join(PACKAGES_DIR, srcPath), {
        nodir: true,
      }),
    ),
  );

  console.log(
    '\n' +
      chalk.bold.inverse.yellow(
        'EXPERIMENTAL - Building generated react-native package types',
      ) +
      '\n',
  );

  await Promise.all(
    files.map(async file => {
      if (micromatch.isMatch(file, IGNORE_PATTERN)) {
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

function ignoreShadowedFiles(files /*: Array<string> */) /*: Array<string> */ {
  const shadowedPrefixes /*: Record<string, boolean> */ = {};
  const result /*: Array<string> */ = [];

  // Find all flow definition files that shadow other files
  for (const file of files) {
    if (/\.flow\.js$/.test(file)) {
      shadowedPrefixes[file.substring(0, file.length - 8)] = true;
    }
  }

  // Filter out all files shadowed by flow definition files
  for (const file of files) {
    const prefix = file.split('.')[0];
    if (/\.flow\.js$/.test(file) || !shadowedPrefixes[prefix]) {
      result.push(file);
    }
  }

  return result;
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}

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
  'react-native/Libraries/Alert/**/*.{js,flow}',
  'react-native/Libraries/ActionSheetIOS/**/*.{js,flow}',
  'react-native/Libraries/Components/ToastAndroid/*.{js,flow}',
  'react-native/Libraries/TurboModule/RCTExport.js',
  'react-native/Libraries/Types/RootTagTypes.js',
  'react-native/Libraries/ReactNative/RootTag.js',
  'react-native/Libraries/Utilities/Platform.js',
  'react-native/src/private/specs_DEPRECATED/modules/NativeAlertManager.js',
  'react-native/src/private/specs_DEPRECATED/modules/NativeActionSheetManager.js',
  'react-native/src/private/specs/modules/NativeToastAndroid.js',
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
      .replace(/\.js\.flow$/, '.js')
      .replace(/\.js$/, '.d.ts'),
  );
}

function splitPathAndExtension(file /*: string */) /*: [string, string] */ {
  const lastSep = file.lastIndexOf(path.sep);
  const extensionStart = file.indexOf('.', lastSep);
  return [
    file.substring(0, extensionStart),
    file.substring(extensionStart, file.length),
  ];
}

function ignoreShadowedFiles(files /*: Array<string> */) /*: Array<string> */ {
  const commonInterfaceFiles /*: Set<string> */ = new Set();
  const result /*: Array<string> */ = [];

  // Find all common interface files
  for (const file of files) {
    const [pathWithoutExt, extension] = splitPathAndExtension(file);
    if (/(\.js|\.flow)$/.test(extension)) {
      commonInterfaceFiles.add(pathWithoutExt);
    }
  }

  for (const file of files) {
    const [pathWithoutExt, extension] = splitPathAndExtension(file);

    // Skip android and ios files from being generated and enforce that they
    // have a common interface file, either in the form of .js.flow or .js file
    if (/(\.android\.js|\.ios\.js)$/.test(extension)) {
      if (!commonInterfaceFiles.has(pathWithoutExt)) {
        throw new Error(`No common interface found for ${file}`);
      }
      continue;
    }

    // Skip desktop files and don't enforce common interface for them as they
    // are entirely ignored by the current flow config
    if (/(\.windows\.js|\.macos\.js)$/.test(extension)) {
      continue;
    }

    result.push(file);
  }

  return result;
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}

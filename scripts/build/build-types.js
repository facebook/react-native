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
const debugModule = require('debug');
const debug = require('debug')('build-types');
const {existsSync, promises: fs} = require('fs');
const glob = require('glob');
const path = require('path');
const {parseArgs} = require('util');

const OUTPUT_DIR = 'types_generated';

const IGNORE_PATTERNS = [
  '**/__{tests,mocks,fixtures,flowtests}__/**',
  '**/*.{macos,windows}.js',
];

const SOURCE_PATTERNS = [
  'react-native/Libraries/ActionSheetIOS/**/*.js',
  'react-native/Libraries/Alert/**/*.js',
  'react-native/Libraries/Components/ToastAndroid/*.js',
  'react-native/Libraries/ReactNative/RootTag.js',
  'react-native/Libraries/Settings/**/*.js',
  'react-native/Libraries/TurboModule/RCTExport.js',
  'react-native/Libraries/Types/RootTagTypes.js',
  'react-native/Libraries/Utilities/Platform.js',
  'react-native/Libraries/Share/**/*.js',
  'react-native/src/private/specs_DEPRECATED/modules/NativeAlertManager.js',
  'react-native/src/private/specs_DEPRECATED/modules/NativeActionSheetManager.js',
  'react-native/src/private/specs_DEPRECATED/modules/NativeSettingsManager.js',
  'react-native/src/private/specs_DEPRECATED/modules/NativeShareModule.js',
  'react-native/src/private/specs/modules/NativeToastAndroid.js',
  // TODO(T210505412): Include input packages, e.g. virtualized-lists
];

const config = {
  options: {
    debug: {type: 'boolean'},
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    values: {debug: debugEnabled, help},
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/build/build-types.js

  [Experimental] Build generated TypeScript types for react-native.
    `);
    process.exitCode = 0;
    return;
  }

  if (debugEnabled) {
    debugModule.enable('build-types');
  }

  console.log(
    '\n' +
      chalk.bold.inverse.yellow(
        'EXPERIMENTAL - Building generated react-native package types',
      ) +
      '\n',
  );

  const files /*: Set<string> */ = new Set(
    SOURCE_PATTERNS.flatMap(srcPath =>
      glob.sync(path.join(PACKAGES_DIR, srcPath), {
        nodir: true,
        ignore: IGNORE_PATTERNS,
      }),
    ),
  );

  // Require common interface file (js.flow) or base implementation (.js) for
  // platform-specific files (.android.js or .ios.js)
  for (const file of files) {
    const [pathWithoutExt, extension] = splitPathAndExtension(file);

    if (/(\.android\.js|\.ios\.js)$/.test(extension)) {
      files.delete(file);

      let resolved = false;

      for (const ext of ['.js.flow', '.js']) {
        let interfaceFile = pathWithoutExt + ext;

        if (files.has(interfaceFile)) {
          resolved = true;
          break;
        }

        if (existsSync(interfaceFile)) {
          files.add(interfaceFile);
          resolved = true;
          debug(
            'Resolved %s to %s',
            path.relative(REPO_ROOT, file),
            path.relative(REPO_ROOT, interfaceFile),
          );
          break;
        }
      }

      if (!resolved) {
        throw new Error(
          `No common interface found for ${file}.[android|ios].js. This ` +
            'should either be a base .js implementation or a .js.flow interface file.',
        );
      }
    }
  }

  await Promise.all(
    Array.from(files).map(async file => {
      const buildPath = getBuildPath(file);
      const source = await fs.readFile(file, 'utf-8');

      try {
        const typescriptDef = await translateSourceFile(source);

        await fs.mkdir(path.dirname(buildPath), {recursive: true});
        await fs.writeFile(buildPath, typescriptDef);
      } catch (e) {
        console.error(`Failed to build ${path.relative(REPO_ROOT, file)}\n`, e);
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
      .replace(packageDir, OUTPUT_DIR)
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

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}

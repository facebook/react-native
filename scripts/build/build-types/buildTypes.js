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

const {PACKAGES_DIR, REPO_ROOT} = require('../../consts');
const translatedModuleTemplate = require('./templates/translatedModule.d.ts-template');
const translateSourceFile = require('./translateSourceFile');
const debug = require('debug')('build-types:main');
const {existsSync, promises: fs} = require('fs');
const micromatch = require('micromatch');
const path = require('path');

const OUTPUT_DIR = 'types_generated';

const IGNORE_PATTERNS = [
  '**/__{tests,mocks,fixtures,flowtests}__/**',
  '**/*.{macos,windows}.js',
];

const ENTRY_POINTS = [
  // TODO: Re-include when all deps are translatable
  // 'packages/react-native/Libraries/ActionSheetIOS/ActionSheetIOS.js',
  // 'packages/react-native/Libraries/Share/Share.js',
  'packages/react-native/Libraries/Alert/Alert.js',
  'packages/react-native/Libraries/EventEmitter/NativeEventEmitter.js',
  'packages/react-native/Libraries/EventEmitter/RCTDeviceEventEmitter.js',
  'packages/react-native/Libraries/EventEmitter/RCTNativeAppEventEmitter.js',
  'packages/react-native/Libraries/AppState/AppState.js',
  'packages/react-native/Libraries/Components/ToastAndroid/ToastAndroid.js',
  'packages/react-native/Libraries/Settings/Settings.js',
  'packages/react-native/Libraries/Performance/Systrace.js',
  'packages/react-native/Libraries/LogBox/LogBox.js',
  'packages/react-native/Libraries/vendor/emitter/EventEmitter.js',
  'packages/react-native/Libraries/ReactNative/UIManager.js',
];

/**
 * [Experimental] Build generated TypeScript types for react-native.
 */
async function buildTypes(): Promise<void> {
  const files = new Set<string>(
    ENTRY_POINTS.map(file => path.join(REPO_ROOT, file)),
  );
  const translatedFiles = new Set<string>();

  while (files.size > 0) {
    const dependencies = await translateSourceFiles(files);

    files.forEach(file => translatedFiles.add(file));
    files.clear();

    for (const dep of dependencies) {
      if (
        !translatedFiles.has(dep) &&
        !IGNORE_PATTERNS.some(pattern => micromatch.isMatch(dep, pattern))
      ) {
        files.add(dep);
      }
    }
  }

  await translateSourceFiles(files);
}

async function translateSourceFiles(
  inputFiles: $ReadOnlySet<string>,
): Promise<Set<string>> {
  const files = new Set<string>([...inputFiles]);

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

  const dependencies = new Set<string>();

  await Promise.all(
    Array.from(files).map(async file => {
      const buildPath = getBuildPath(file);
      const source = await fs.readFile(file, 'utf-8');

      try {
        const {result: typescriptDef, dependencies: fileDeps} =
          await translateSourceFile(source, file);

        for (const dep of fileDeps) {
          dependencies.add(dep);
        }

        await fs.mkdir(path.dirname(buildPath), {recursive: true});
        await fs.writeFile(
          buildPath,
          translatedModuleTemplate({
            originalFileName: path.relative(REPO_ROOT, file),
            source: stripDocblock(typescriptDef),
          }),
        );
      } catch (e) {
        console.error(`Failed to build ${path.relative(REPO_ROOT, file)}\n`, e);
      }
    }),
  );

  return dependencies;
}

function getPackageName(file: string): string {
  return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file: string): string {
  const packageDir = path.join(PACKAGES_DIR, getPackageName(file));

  return path.join(
    packageDir,
    file
      .replace(packageDir, OUTPUT_DIR)
      .replace(/\.js\.flow$/, '.js')
      .replace(/\.js$/, '.d.ts'),
  );
}

function splitPathAndExtension(file: string): [string, string] {
  const lastSep = file.lastIndexOf(path.sep);
  const extensionStart = file.indexOf('.', lastSep);
  return [
    file.substring(0, extensionStart),
    file.substring(extensionStart, file.length),
  ];
}

function stripDocblock(source: string): string {
  return source.replace(/\/\*\*[\s\S]*?\*\/\n/, '');
}

module.exports = buildTypes;

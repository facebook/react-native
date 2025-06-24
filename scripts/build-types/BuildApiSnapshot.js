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

import type {PluginObj} from '@babel/core';

const {PACKAGES_DIR, REACT_NATIVE_PACKAGE_DIR} = require('../consts');
const {isGitRepo} = require('../scm-utils');
const {API_EXTRACTOR_CONFIG_FILE, TYPES_OUTPUT_DIR} = require('./config');
const apiSnapshotTemplate = require('./templates/ReactNativeApi.d.ts-template.js');
const resolveCyclicImportsInDefinition = require('./transforms/resolveCyclicImportsInDefinition');
const babel = require('@babel/core');
const {
  Extractor,
  ExtractorConfig,
  // $FlowFixMe[cannot-resolve-module]
} = require('@microsoft/api-extractor');
const {promises: fs} = require('fs');
const glob = require('glob');
const {diff} = require('jest-diff');
const path = require('path');
const prettier = require('prettier');
const osTempDir = require('temp-dir');
const {styleText} = require('util');

const inputFilesPostTransforms: $ReadOnlyArray<PluginObj<mixed>> = [
  require('./transforms/renameDefaultExportedIdentifiers'),
];

const postTransforms: $ReadOnlyArray<PluginObj<mixed>> = [
  require('./transforms/stripUnstableApis'),
  require('./transforms/inlineTypes'),
  require('./transforms/sortTypeDefinitions'),
  require('./transforms/sortProperties'),
  require('./transforms/sortUnions'),
  require('./transforms/removeUndefinedFromOptionalMembers'),
];

async function buildAPISnapshot(validate: boolean) {
  console.log(
    styleText('yellow', '  >') + ' Creating temp dir for api-extractor',
  );
  const tempDirectory = await createTempDir('react-native-js-api-snapshot');
  const packages = await findPackagesWithTypedef();

  console.log(styleText('yellow', '  >') + ' Preparing codebase in temp dir');
  await preparePackagesInTempDir(tempDirectory, packages);
  await rewriteLocalImports(tempDirectory, packages);

  console.log(styleText('yellow', '  >') + ' Running api-extractor');
  const extractorConfig = ExtractorConfig.loadFileAndPrepare(
    path.join(tempDirectory, API_EXTRACTOR_CONFIG_FILE),
  );
  const extractorResult = Extractor.invoke(extractorConfig, {
    localBuild: true,
    showVerboseMessages: true,
  });

  if (!extractorResult.succeeded) {
    console.error(
      '\n' +
        styleText(['bold', 'inverse', 'red'], ' FAIL ') +
        ' api-extractor encountered errors.\n',
    );
    process.exitCode = 1;
    return;
  }

  console.log(styleText('yellow', '  >') + ' Applying additional transforms');
  const apiSnapshot = apiSnapshotTemplate(
    await getCleanedUpRollup(tempDirectory),
  ) as string;

  console.log(styleText('yellow', '  >') + ' Removing temp dir');
  await fs.rm(tempDirectory, {recursive: true});

  const snapshotPath = path.join(
    REACT_NATIVE_PACKAGE_DIR,
    'ReactNativeApi.d.ts',
  );

  if (validate) {
    console.log(
      '\n' +
        styleText(
          ['bold', 'inverse'],
          ' Validating API snapshot (--validate) ',
        ) +
        '\n',
    );
    console.log(
      styleText('yellow', '  >') +
        ' Diffing API with snapshot on disk\n' +
        '    ' +
        styleText('underline', snapshotPath) +
        '\n',
    );
    const prevSnapshot = await fs.readFile(snapshotPath, 'utf-8');
    const hasChanged = await validateSnapshots(prevSnapshot, apiSnapshot);
    if (hasChanged) {
      process.exitCode = 1;
    }
    return;
  }

  await fs.writeFile(snapshotPath, apiSnapshot);
  console.log(
    styleText('green', '  ✔') +
      ' API snapshot written to ' +
      styleText('underline', snapshotPath) +
      '\n',
  );
}

async function validateSnapshots(
  prevSnapshot: string,
  newSnapshot: string,
): Promise<boolean> {
  const hasChanged = newSnapshot !== prevSnapshot;
  if (hasChanged) {
    const options = {
      aAnnotation: 'Previous Snapshot',
      bAnnotation: 'New Snapshot',
      expand: false,
      emptyFirstOrLastLinePlaceholder: '↵',
      includeChangeCounts: true,
      aColor: (line: string) => styleText(['red'], line),
      bColor: (line: string) => styleText(['green'], line),
    };

    const diffResult = diff(prevSnapshot, newSnapshot, options);
    const rerunCommand = isGitRepo() ? 'yarn build-types' : 'js1 build-js-api';
    console.error(
      `${styleText(['bold', 'inverse', 'red'], ' FAIL ')} ReactNativeApi.d.ts has changed. Please re-run '${rerunCommand}' and commit the updated snapshot.\n`,
    );
    console.error(diffResult);
  } else {
    console.log(
      `${styleText(['bold', 'inverse', 'green'], ' PASS ')} API snapshot is up to date.\n`,
    );
  }

  return hasChanged;
}

async function findPackagesWithTypedef() {
  const packagesWithGeneratedTypes = glob
    .sync(`${PACKAGES_DIR}/**/types_generated`, {nodir: false})
    .map(typesPath =>
      path.relative(PACKAGES_DIR, typesPath).split('/').slice(0, -1).join('/'),
    );

  const packagesWithNames = await Promise.all(
    packagesWithGeneratedTypes.map(async pkg => {
      const packageJsonContent = await fs.readFile(
        path.join(PACKAGES_DIR, pkg, 'package.json'),
        'utf-8',
      );
      const packageJson = JSON.parse(packageJsonContent);

      return {
        directory: pkg,
        name: packageJson.name as string,
      };
    }),
  );

  return packagesWithNames;
}

async function preparePackagesInTempDir(
  tempDirectory: string,
  packages: $ReadOnlyArray<{directory: string, name: string}>,
) {
  await generateConfigFiles(tempDirectory);

  await Promise.all(
    packages.map(async pkg => {
      await copyDirectory(
        path.join(PACKAGES_DIR, pkg.directory, TYPES_OUTPUT_DIR),
        path.join(tempDirectory, pkg.directory),
      );
    }),
  );

  const typeDefs = glob.sync(`${tempDirectory}/**/*.d.ts`);
  await Promise.all(
    typeDefs.map(async file => {
      const source = await fs.readFile(file, 'utf-8');
      const transformed = await applyPostTransforms(
        source,
        inputFilesPostTransforms,
      );
      await fs.writeFile(file, transformed);
    }),
  );
}

/**
 * Rewrite imports to local packages in the temp directory. We do this to
 * avoid cyclic references, which API Extractor cannot process.
 */
async function rewriteLocalImports(
  tempDirectory: string,
  packages: $ReadOnlyArray<{directory: string, name: string}>,
) {
  const definitions = glob.sync(`${tempDirectory}/**/*.d.ts`);

  await Promise.all(
    definitions.map(async file => {
      const source = await fs.readFile(file, 'utf-8');
      const fixedImports = await resolveCyclicImportsInDefinition({
        packages: packages,
        rootPath: tempDirectory,
        sourcePath: file,
        source: source,
      });
      await fs.writeFile(file, fixedImports);
    }),
  );
}

async function getCleanedUpRollup(tempDirectory: string) {
  const rollupPath = path.join(
    tempDirectory,
    'react-native',
    'dist',
    'ReactNativeApi.d.ts',
  );
  const sourceRollup = await fs.readFile(rollupPath, 'utf-8');

  const cleanedRollup = sourceRollup
    .replace(/\/\*[\s\S]*?\*\//gm, '') // Remove block comments
    .replace(/\\\\.*$/gm, '') // Remove inline comments
    .replace(/^\s+$/gm, '') // Clear whitespace-only lines
    .replace(/\n+/gm, '\n'); // Collapse empty lines

  const transformedRollup = await applyPostTransforms(
    cleanedRollup,
    postTransforms,
  );

  const formattedRollup = prettier.format(transformedRollup, {
    parser: 'typescript',
    semi: false,
    trailingComma: 'all',
  });

  return formattedRollup;
}

async function applyPostTransforms(
  inSrc: string,
  transforms: $ReadOnlyArray<PluginObj<mixed>>,
): Promise<string> {
  const result = await babel.transformAsync(inSrc, {
    plugins: ['@babel/plugin-syntax-typescript', ...transforms],
  });

  return result.code;
}

async function generateConfigFiles(tempDirectory: string) {
  // generate tsconfig
  const tsConfig = {
    $schema: 'http://json.schemastore.org/tsconfig',
  };

  const outPath = path.join(tempDirectory, 'tsconfig.json');

  await fs.mkdir(path.dirname(outPath), {recursive: true});
  await fs.writeFile(outPath, JSON.stringify(tsConfig, null, 2));

  // generate api extractor config
  const apiExtractorConfig = await fs.readFile(
    path.join(__dirname, 'templates', API_EXTRACTOR_CONFIG_FILE),
    'utf-8',
  );
  const adjustedApiExtractorConfig = apiExtractorConfig.replaceAll(
    '${typegen_directory}',
    tempDirectory,
  );
  await fs.writeFile(
    path.join(tempDirectory, API_EXTRACTOR_CONFIG_FILE),
    adjustedApiExtractorConfig,
  );

  // generate basic package.json
  const packageJSON = {name: 'react-native'};
  await fs.writeFile(
    path.join(tempDirectory, 'package.json'),
    JSON.stringify(packageJSON, null, 2),
  );
}

async function copyDirectory(src: string, dest: string) {
  await fs.mkdir(dest, {recursive: true});

  const entries = await fs.readdir(src, {withFileTypes: true});

  for (let entry of entries) {
    // name can only be a buffer when explicitly set as the encoding option
    const fileName: string = entry.name as any;
    const srcPath = path.join(src, fileName);
    const destPath = path.join(dest, fileName);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function createTempDir(dirName: string): Promise<string> {
  // $FlowExpectedError[incompatible-call] temp-dir is typed as a default export
  const tempDir = path.join(osTempDir, dirName);

  await fs.mkdir(tempDir, {recursive: true});

  return tempDir;
}

module.exports = buildAPISnapshot;

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

const babel = require('@babel/core');
const chalk = require('chalk');
const glob = require('glob');
const micromatch = require('micromatch');
const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const {buildConfig, getBabelConfig} = require('./config');

const PACKAGES_DIR /*: string */ = path.resolve(__dirname, '../../packages');
const SRC_DIR = 'src';
const BUILD_DIR = 'dist';
const JS_FILES_PATTERN = '**/*.js';
const IGNORE_PATTERN = '**/__{tests,mocks,fixtures}__/**';

function build() {
  const argv = process.argv.slice(2);

  if (argv.includes('--help')) {
    console.log(`
  Usage: node ./scripts/build/build.js <packages>

  Build packages (shared monorepo build setup).

  By default, builds all packages defined in ./scripts/build/config.js. If a
  a package list is provided, builds only those specified.
    `);
    process.exit(0);
  }

  console.log('\n' + chalk.bold.inverse('Building packages') + '\n');

  if (argv.length) {
    argv
      .filter(packageName => packageName in buildConfig.packages)
      .forEach(buildPackage);
  } else {
    Object.keys(buildConfig.packages).forEach(buildPackage);
  }

  console.log(
    '\nTip: Use ' +
      chalk.bold.inverse('yarn watch') +
      ' to build continuously when working on these packages.\n',
  );
  process.exit(0);
}

function buildPackage(packageName /*: string */) {
  const files = glob.sync(
    path.resolve(PACKAGES_DIR, packageName, SRC_DIR, '**/*'),
    {nodir: true},
  );

  process.stdout.write(
    `${packageName} ${chalk.dim('.').repeat(72 - packageName.length)} `,
  );
  files.forEach(file => buildFile(file, true));
  process.stdout.write(chalk.reset.inverse.bold.green(' DONE ') + '\n');
}

function buildFile(file /*: string */, silent /*: boolean */ = false) {
  const packageName = getPackageName(file);
  const buildPath = getBuildPath(file);

  const logResult = (copied /*: boolean */, desc /*: ?string */ = null) =>
    silent ||
    console.log(
      chalk.dim('  - ') +
        path.relative(PACKAGES_DIR, file) +
        (copied ? ' -> ' + path.relative(PACKAGES_DIR, buildPath) : ' ') +
        (desc != null ? ' (' + desc + ')' : ''),
    );

  if (micromatch.isMatch(file, IGNORE_PATTERN)) {
    logResult(false, 'ignore');
    return;
  }

  fs.mkdirSync(path.dirname(buildPath), {recursive: true});

  if (!micromatch.isMatch(file, JS_FILES_PATTERN)) {
    fs.copyFileSync(file, buildPath);
    logResult(true, 'copy');
  } else {
    const transformed = prettier.format(
      babel.transformFileSync(file, getBabelConfig(packageName)).code,
      {parser: 'babel'},
    );
    fs.writeFileSync(buildPath, transformed);

    if (/@flow/.test(fs.readFileSync(file, 'utf-8'))) {
      fs.copyFileSync(file, buildPath + '.flow');
    }

    logResult(true);
  }
}

function getPackageName(file /*: string */) /*: string */ {
  return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file /*: string */) /*: string */ {
  const packageDir = path.join(PACKAGES_DIR, getPackageName(file));

  return path.join(
    packageDir,
    file.replace(path.join(packageDir, SRC_DIR), BUILD_DIR),
  );
}

module.exports = {
  buildFile,
  getBuildPath,
  BUILD_DIR,
  PACKAGES_DIR,
  SRC_DIR,
};

if (require.main === module) {
  build();
}

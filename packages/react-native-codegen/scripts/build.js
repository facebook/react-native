/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * script to build (transpile) files.
 *
 * Based off of the build script from Metro, and tweaked to run in just one
 * package instead of in a monorepo. Just run `build.js` and the JS files in
 * `src/` will be built in `lib/`, and the original source files will be copied
 * over as `Example.js.flow`, so consumers of this module can still make use of
 * type checking.
 *
 * Call this script with the `--verbose` flag to show the full output of this
 * script.
 */

'use strict';

const babel = require('@babel/core');
const chalk = require('chalk');
const fs = require('fs');
const glob = require('glob');
const micromatch = require('micromatch');
const mkdirp = require('mkdirp');
const path = require('path');
const prettier = require('prettier');
const prettierConfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', '.prettierrc'), 'utf8'),
);

const SRC_DIR = 'src';
const BUILD_DIR = 'lib';
const JS_FILES_PATTERN = '**/*.js';
const IGNORE_PATTERN = '**/__tests__/**';
const PACKAGE_DIR = path.resolve(__dirname, '../');

const fixedWidth = str => {
  const WIDTH = 80;
  const strs = str.match(new RegExp(`(.{1,${WIDTH}})`, 'g')) || [str];
  let lastString = strs[strs.length - 1];
  if (lastString.length < WIDTH) {
    lastString += Array(WIDTH - lastString.length).join(chalk.dim('.'));
  }
  return strs.slice(0, -1).concat(lastString).join('\n');
};

function getBuildPath(file, buildFolder) {
  const pkgSrcPath = path.resolve(PACKAGE_DIR, SRC_DIR);
  const pkgBuildPath = path.resolve(PACKAGE_DIR, BUILD_DIR);
  const relativeToSrcPath = path.relative(pkgSrcPath, file);
  return path.resolve(pkgBuildPath, relativeToSrcPath);
}

function buildFile(file, silent) {
  const destPath = getBuildPath(file, BUILD_DIR);

  mkdirp.sync(path.dirname(destPath));
  if (micromatch.isMatch(file, IGNORE_PATTERN)) {
    silent ||
      process.stdout.write(
        chalk.dim('  \u2022 ') +
          path.relative(PACKAGE_DIR, file) +
          ' (ignore)\n',
      );
  } else if (!micromatch.isMatch(file, JS_FILES_PATTERN)) {
    fs.createReadStream(file).pipe(fs.createWriteStream(destPath));
    silent ||
      process.stdout.write(
        chalk.red('  \u2022 ') +
          path.relative(PACKAGE_DIR, file) +
          chalk.red(' \u21D2 ') +
          path.relative(PACKAGE_DIR, destPath) +
          ' (copy)' +
          '\n',
      );
  } else {
    const transformed = prettier.format(
      babel.transformFileSync(file, {}).code,
      {
        ...prettierConfig,
        parser: 'babel',
      },
    );
    fs.writeFileSync(destPath, transformed);
    const source = fs.readFileSync(file).toString('utf-8');
    if (/@flow/.test(source)) {
      fs.createReadStream(file).pipe(fs.createWriteStream(destPath + '.flow'));
    }
    silent ||
      process.stdout.write(
        chalk.green('  \u2022 ') +
          path.relative(PACKAGE_DIR, file) +
          chalk.green(' \u21D2 ') +
          path.relative(PACKAGE_DIR, destPath) +
          '\n',
      );
  }
}

const srcDir = path.resolve(__dirname, '..', SRC_DIR);
const pattern = path.resolve(srcDir, '**/*');
const files = glob.sync(pattern, {nodir: true});

process.stdout.write(fixedWidth(`${path.basename(PACKAGE_DIR)}\n`));

files.forEach(file => buildFile(file, !process.argv.includes('--verbose')));

process.stdout.write(`[  ${chalk.green('OK')}  ]\n`);

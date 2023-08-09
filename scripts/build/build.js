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
const {parseArgs} = require('@pkgjs/parseargs');
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

const config = {
  allowPositionals: true,
  options: {
    help: {type: 'boolean'},
  },
};

function build() {
  const {
    positionals: packageNames,
    values: {help},
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/build/build.js <packages>

  Build packages (shared monorepo build setup).

  By default, builds all packages defined in ./scripts/build/config.js. If a
  a package list is provided, builds only those specified.
    `);
    process.exitCode = 0;
    return;
  }

  console.log('\n' + chalk.bold.inverse('Building packages') + '\n');

  if (packageNames.length) {
    packageNames
      .filter(packageName => packageName in buildConfig.packages)
      .forEach(buildPackage);
  } else {
    Object.keys(buildConfig.packages).forEach(buildPackage);
  }

  process.exitCode = 0;
}

function buildPackage(packageName /*: string */) {
  const files = glob.sync(
    path.resolve(PACKAGES_DIR, packageName, SRC_DIR, '**/*'),
    {nodir: true},
  );
  const packageJsonPath = path.join(PACKAGES_DIR, packageName, 'package.json');

  process.stdout.write(
    `${packageName} ${chalk.dim('.').repeat(72 - packageName.length)} `,
  );
  files.forEach(file => buildFile(path.normalize(file), true));
  rewritePackageExports(packageJsonPath);
  process.stdout.write(chalk.reset.inverse.bold.green(' DONE ') + '\n');
}

function buildFile(file /*: string */, silent /*: boolean */ = false) {
  const packageName = getPackageName(file);
  const buildPath = getBuildPath(file);

  const logResult = ({copied, desc} /*: {copied: boolean, desc?: string} */) =>
    silent ||
    console.log(
      chalk.dim('  - ') +
        path.relative(PACKAGES_DIR, file) +
        (copied ? ' -> ' + path.relative(PACKAGES_DIR, buildPath) : ' ') +
        (desc != null ? ' (' + desc + ')' : ''),
    );

  if (micromatch.isMatch(file, IGNORE_PATTERN)) {
    logResult({copied: false, desc: 'ignore'});
    return;
  }

  fs.mkdirSync(path.dirname(buildPath), {recursive: true});

  if (!micromatch.isMatch(file, JS_FILES_PATTERN)) {
    fs.copyFileSync(file, buildPath);
    logResult({copied: true, desc: 'copy'});
  } else {
    const transformed = prettier.format(
      babel.transformFileSync(file, getBabelConfig(packageName)).code,
      {parser: 'babel'},
    );
    fs.writeFileSync(buildPath, transformed);

    if (/@flow/.test(fs.readFileSync(file, 'utf-8'))) {
      fs.copyFileSync(file, buildPath + '.flow');
    }

    logResult({copied: true});
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

function rewritePackageExports(packageJsonPath /*: string */) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, {encoding: 'utf8'}));

  if (pkg.exports == null) {
    return;
  }

  pkg.exports = rewriteExportsField(pkg.exports);

  fs.writeFileSync(
    packageJsonPath,
    prettier.format(JSON.stringify(pkg), {parser: 'json'}),
  );
}

/*::
type ExportsField = {
  [subpath: string]: ExportsField | string,
} | string;
*/

function rewriteExportsField(
  exportsField /*: ExportsField */,
) /*: ExportsField */ {
  if (typeof exportsField === 'string') {
    return rewriteExportsTarget(exportsField);
  }

  for (const key in exportsField) {
    if (typeof exportsField[key] === 'string') {
      exportsField[key] = rewriteExportsTarget(exportsField[key]);
    } else if (typeof exportsField[key] === 'object') {
      exportsField[key] = rewriteExportsField(exportsField[key]);
    }
  }

  return exportsField;
}

function rewriteExportsTarget(target /*: string */) /*: string */ {
  return target.replace('./' + SRC_DIR + '/', './' + BUILD_DIR + '/');
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

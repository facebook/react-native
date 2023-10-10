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
const translate = require('flow-api-translator');
const glob = require('glob');
const micromatch = require('micromatch');
const {promises: fs} = require('fs');
const path = require('path');
const prettier = require('prettier');
const ts = require('typescript');
const {
  buildConfig,
  getBabelConfig,
  getBuildOptions,
  getTypeScriptCompilerOptions,
} = require('./config');

const REPO_ROOT = path.resolve(__dirname, '../..');
const PACKAGES_DIR /*: string */ = path.join(REPO_ROOT, 'packages');
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

async function build() {
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

  const packagesToBuild = packageNames.length
    ? packageNames.filter(packageName => packageName in buildConfig.packages)
    : Object.keys(buildConfig.packages);

  for (const packageName of packagesToBuild) {
    await buildPackage(packageName);
  }

  process.exitCode = 0;
}

async function buildPackage(packageName /*: string */) {
  const {emitTypeScriptDefs} = getBuildOptions(packageName);
  const files = glob.sync(
    path.resolve(PACKAGES_DIR, packageName, SRC_DIR, '**/*'),
    {nodir: true},
  );

  process.stdout.write(
    `${packageName} ${chalk.dim('.').repeat(72 - packageName.length)} `,
  );

  // Build all files matched for package
  for (const file of files) {
    await buildFile(path.normalize(file), true);
  }

  // Validate program for emitted .d.ts files
  if (emitTypeScriptDefs) {
    validateTypeScriptDefs(packageName);
  }

  // Rewrite package.json "exports" field (src -> dist)
  await rewritePackageExports(packageName);

  process.stdout.write(chalk.reset.inverse.bold.green(' DONE ') + '\n');
}

async function buildFile(file /*: string */, silent /*: boolean */ = false) {
  const packageName = getPackageName(file);
  const buildPath = getBuildPath(file);
  const {emitFlowDefs, emitTypeScriptDefs} = getBuildOptions(packageName);

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

  await fs.mkdir(path.dirname(buildPath), {recursive: true});

  if (!micromatch.isMatch(file, JS_FILES_PATTERN)) {
    await fs.copyFile(file, buildPath);
    logResult({copied: true, desc: 'copy'});
    return;
  }

  const source = await fs.readFile(file, 'utf-8');
  const prettierConfig = {parser: 'babel'};

  // Transform source file using Babel
  const transformed = prettier.format(
    (await babel.transformFileAsync(file, getBabelConfig(packageName))).code,
    prettierConfig,
  );
  await fs.writeFile(buildPath, transformed);

  // Translate source Flow types for each type definition target
  if (/@flow/.test(source)) {
    await Promise.all([
      emitFlowDefs
        ? fs.writeFile(
            buildPath + '.flow',
            await translate.translateFlowToFlowDef(source, prettierConfig),
          )
        : null,
      emitTypeScriptDefs
        ? fs.writeFile(
            buildPath.replace(/\.js$/, '') + '.d.ts',
            await translate.translateFlowToTSDef(source, prettierConfig),
          )
        : null,
    ]);
  }

  logResult({copied: true});
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

async function rewritePackageExports(packageName /*: string */) {
  const packageJsonPath = path.join(PACKAGES_DIR, packageName, 'package.json');
  const pkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

  if (pkg.exports == null) {
    throw new Error(
      packageName +
        ' does not define an "exports" field in its package.json. As part ' +
        'of the build setup, this field must be used in order to rewrite ' +
        'paths to built files in production.',
    );
  }

  pkg.exports = rewriteExportsField(pkg.exports);

  await fs.writeFile(
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

function validateTypeScriptDefs(packageName /*: string */) {
  const files = glob.sync(
    path.resolve(PACKAGES_DIR, packageName, BUILD_DIR, '**/*.d.ts'),
  );
  const compilerOptions = {
    ...getTypeScriptCompilerOptions(packageName),
    noEmit: true,
    skipLibCheck: false,
  };
  const program = ts.createProgram(files, compilerOptions);
  const emitResult = program.emit();

  if (emitResult.diagnostics.length) {
    for (const diagnostic of emitResult.diagnostics) {
      if (diagnostic.file != null) {
        let {line, character} = ts.getLineAndCharacterOfPosition(
          diagnostic.file,
          diagnostic.start,
        );
        let message = ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          '\n',
        );
        console.log(
          // $FlowIssue[incompatible-use] Type refined above
          `${diagnostic.file.fileName} (${line + 1},${
            character + 1
          }): ${message}`,
        );
      } else {
        console.log(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        );
      }
    }

    throw new Error(
      'Failing build because TypeScript errors were encountered for ' +
        'generated type definitions.',
    );
  }
}

module.exports = {
  buildFile,
  getBuildPath,
  BUILD_DIR,
  PACKAGES_DIR,
  SRC_DIR,
};

if (require.main === module) {
  // eslint-disable-next-line no-void
  void build();
}

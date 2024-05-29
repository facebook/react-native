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

const {PACKAGES_DIR} = require('../consts');
const {
  buildConfig,
  getBabelConfig,
  getBuildOptions,
  getTypeScriptCompilerOptions,
} = require('./config');
const babel = require('@babel/core');
const {parseArgs} = require('@pkgjs/parseargs');
const chalk = require('chalk');
const translate = require('flow-api-translator');
const {accessSync, constants, promises: fs, readFileSync} = require('fs');
const glob = require('glob');
const micromatch = require('micromatch');
const path = require('path');
const prettier = require('prettier');
const ts = require('typescript');

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

function invert(map /*: Map<string, string>*/) /*: Map<string, string> */ {
  const result /*: Map<string, string>*/ = new Map();
  for (const [key, value] of map.entries()) {
    result.set(value, key);
  }
  return result;
}

async function buildPackage(packageName /*: string */) {
  const {emitTypeScriptDefs} = getBuildOptions(packageName);
  const entryPointRewrites = getEntryPoints(packageName);

  const files = glob
    .sync(path.resolve(PACKAGES_DIR, packageName, SRC_DIR, '**/*'), {
      nodir: true,
    })
    .filter(file => !entryPointRewrites.has(file));

  process.stdout.write(
    `${packageName} ${chalk.dim('.').repeat(72 - packageName.length)} `,
  );

  const invertedEntryPointRewrites = invert(entryPointRewrites);

  // Build all files matched for package
  for (const file of files) {
    await buildFile(path.normalize(file), {
      silent: true,
      destPath: invertedEntryPointRewrites.get(file),
    });
  }

  // Validate program for emitted .d.ts files
  if (emitTypeScriptDefs) {
    validateTypeScriptDefs(packageName);
  }

  // Rewrite package.json "exports" field (src -> dist)
  await rewritePackageExports(packageName);

  process.stdout.write(chalk.reset.inverse.bold.green(' DONE ') + '\n');
}

async function buildFile(
  file /*: string */,
  options /*: {silent?: boolean, destPath?: string}*/ = {},
) {
  const {silent, destPath} = {silent: false, ...options};
  const packageName = getPackageName(file);
  const buildPath = getBuildPath(destPath ?? file);
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

/*::
type PackageJson = {
  name: string,
  exports?: {[lookup: string]: string},
}
*/

// As a convention, we use a .js/.js.flow file pair for each package
// entry point, with the .js file being a Babel wrapper that can be
// used directly in the monorepo. On build, we drop this wrapper and
// emit a single file from the .js.flow contents.
// can be used directly within the repo. When built, this needs to be rewritten
// and the wrapper dropped:
//
// index.js ──────►{remove wrapper}
//              ┌─►index.js
// index.flow.js├─►index.d.ts
//              └─►index.flow.js
function getEntryPoints(packageName /*: string*/) /*: Map<string, string> */ {
  const pkg /*: PackageJson */ = JSON.parse(
    readFileSync(
      path.resolve(PACKAGES_DIR, packageName, 'package.json'),
      'utf8',
    ),
  );

  // Flow files we want transpiled in place of the wrapper js files
  const pathMap /*: Map<string, string>*/ = new Map();

  for (const packagePath in pkg.exports) {
    const original = revertRewriteExportsTarget(pkg.exports[packagePath]);

    // Exported json files shouldn't be considered
    if (!original.endsWith('.js')) {
      continue;
    }

    if (original.endsWith('.flow.js')) {
      throw new Error(
        `${chalk.bold(packageName)} has ${chalk.bold(
          'exports.' + packagePath + ' = "' + original + '"',
        )}. Expecting a .js wrapper file. See other monorepo packages for examples.`,
      );
    }

    // Our special case for wrapper files that need to be stripped
    const entryPoint = path.resolve(PACKAGES_DIR, packageName, original);

    const {dir, name} = path.parse(entryPoint);
    const entryPointFlow = path.join(dir, name + '.flow.js');

    try {
      accessSync(entryPointFlow, constants.F_OK);
    } catch {
      throw new Error(
        `${chalk.bold(
          entryPointFlow,
        )} does not exist when building ${chalk.bold(packageName)}.

The ${chalk.bold("package.json's")} ${chalk.bold(
          'exports["' + packagePath + '"]',
        )}:
  - found:   ${chalk.bold.green(entryPoint)}
  - missing: ${chalk.bold.red(entryPointFlow)}

This is needed so users can directly import the file from the monorepo using Node.`,
      );
    }

    pathMap.set(entryPoint, entryPointFlow);
  }

  return pathMap;
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

  if (pkg.main != null) {
    pkg.main = rewriteExportsTarget(pkg.main);
  }

  await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
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

function revertRewriteExportsTarget(target /*: string */) /*: string */ {
  return target.replace('./' + BUILD_DIR + '/', './' + SRC_DIR + '/');
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

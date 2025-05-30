/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

require('../babel-register').registerForScript();

const {PACKAGES_DIR, REPO_ROOT} = require('../consts');
const {
  buildConfig,
  getBabelConfig,
  getBuildOptions,
  getTypeScriptCompilerOptions,
} = require('./config');
const babel = require('@babel/core');
const chalk = require('chalk');
const translate = require('flow-api-translator');
const {promises: fs} = require('fs');
const glob = require('glob');
const micromatch = require('micromatch');
const path = require('path');
const prettier = require('prettier');
const ts = require('typescript');
const {parseArgs} = require('util');

const SRC_DIR = 'src';
const BUILD_DIR = 'dist';
const JS_FILES_PATTERN = '**/*.js';
const IGNORE_PATTERN = '**/__{tests,mocks,fixtures}__/**';

const config = {
  allowPositionals: true,
  options: {
    check: {type: 'boolean'},
    help: {type: 'boolean'},
  },
};

async function build() {
  const {
    positionals: packageNames,
    values: {check, help},
    /* $FlowFixMe[incompatible-call] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/build/build.js <packages>

  Build packages (shared monorepo build setup).

  By default, builds all packages defined in ./scripts/build/config.js. If a
  a package list is provided, builds only those specified.

  Options:
    --check           Validate that no build artifacts have been accidentally
                      committed.
    `);
    process.exitCode = 0;
    return;
  }

  if (!check) {
    console.log('\n' + chalk.bold.inverse('Building packages') + '\n');
  }

  const packagesToBuild = packageNames.length
    ? packageNames.filter(packageName => packageName in buildConfig.packages)
    : Object.keys(buildConfig.packages);

  let ok = true;
  for (const packageName of packagesToBuild) {
    if (check) {
      ok &&= await checkPackage(packageName);
    } else {
      await buildPackage(packageName);
    }
  }

  process.exitCode = ok ? 0 : 1;
}

async function checkPackage(packageName /*: string */) /*: Promise<boolean> */ {
  const artifacts = await exportedBuildArtifacts(packageName);
  if (artifacts.length > 0) {
    console.log(
      `${chalk.bgRed(packageName)}: has been built and the ${chalk.bold('build artifacts')} committed to the repository. This will break Flow checks.`,
    );
    return false;
  }
  return true;
}

async function buildPackage(packageName /*: string */) {
  try {
    const {emitTypeScriptDefs} = getBuildOptions(packageName);
    const entryPoints = await getEntryPoints(packageName);

    const files = glob
      .sync(path.resolve(PACKAGES_DIR, packageName, SRC_DIR, '**/*'), {
        nodir: true,
      })
      .filter(
        file =>
          !entryPoints.has(file) &&
          !entryPoints.has(file.replace(/\.js$/, '.flow.js')),
      );

    process.stdout.write(
      `${packageName} ${chalk.dim('.').repeat(72 - packageName.length)} `,
    );

    // Build regular files
    for (const file of files) {
      await buildFile(path.normalize(file), {
        silent: true,
      });
    }

    // Build entry point files
    for (const entryPoint of entryPoints) {
      await buildFile(path.normalize(entryPoint), {
        silent: true,
      });
    }

    // Validate program for emitted .d.ts files
    if (emitTypeScriptDefs) {
      validateTypeScriptDefs(packageName);
    }

    // Rewrite package.json "exports" field (src -> dist)
    await rewritePackageExports(packageName);

    process.stdout.write(chalk.reset.inverse.bold.green(' DONE '));
  } catch (e) {
    process.stdout.write(chalk.reset.inverse.bold.red(' FAIL ') + '\n');
    throw e;
  } finally {
    process.stdout.write('\n');
  }
}

async function buildFile(
  file /*: string */,
  options /*: {silent?: boolean, destPath?: string}*/ = {},
) {
  const {silent = false} = options;
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
    /* $FlowFixMe[incompatible-call] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
    prettierConfig,
  );
  await fs.writeFile(buildPath, transformed);

  // Translate source Flow types for each type definition target
  if (/@flow/.test(source)) {
    try {
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
    } catch (e) {
      e.message = `Error translating ${path.relative(PACKAGES_DIR, file)}:\n${e.message}`;
      throw e;
    }
  }

  logResult({copied: true});
}

/*::
type PackageJson = {
  name: string,
  exports?: {[subpath: string]: string | mixed},
};
*/

function isStringOnly(entries /*: mixed */) /*: entries is string */ {
  return typeof entries === 'string';
}

async function exportedBuildArtifacts(
  packageName /*: string */,
) /*: Promise<string[]> */ {
  const packagePath = path.resolve(PACKAGES_DIR, packageName, 'package.json');
  const pkg /*: PackageJson */ = JSON.parse(
    await fs.readFile(packagePath, 'utf8'),
  );
  if (pkg.exports == null) {
    throw new Error(
      packageName +
        ' does not define an "exports" field in its package.json. As part ' +
        'of the build setup, this field must be used in order to rewrite ' +
        'paths to built files in production.',
    );
  }

  return Object.values(pkg.exports)
    .filter(isStringOnly)
    .filter(filepath =>
      path.dirname(filepath).split(path.sep).includes(BUILD_DIR),
    );
}

/**
 * Get the set of Flow entry points to build.
 *
 * As a convention, we use a .js/.flow.js file pair for each package entry
 * point, with the .js file being a Babel wrapper that can be used directly in
 * the monorepo. On build, we drop this wrapper and emit a single file from the
 * .flow.js contents.
 *
 * index.js ──────►(removed)
 *              ┌─►index.js
 * index.flow.js├─►index.d.ts
 *              └─►index.js.flow
 */
async function getEntryPoints(
  packageName /*: string */,
) /*: Promise<Set<string>> */ {
  const packagePath = path.resolve(PACKAGES_DIR, packageName, 'package.json');
  const pkg /*: PackageJson */ = JSON.parse(
    await fs.readFile(packagePath, 'utf8'),
  );
  const entryPoints /*: Set<string> */ = new Set();

  if (pkg.exports == null) {
    throw new Error(
      packageName +
        ' does not define an "exports" field in its package.json. As part ' +
        'of the build setup, this field must be used in order to rewrite ' +
        'paths to built files in production.',
    );
  }

  const exportsEntries = Object.entries(pkg.exports);

  for (const [subpath, targetOrConditionsObject] of exportsEntries) {
    const targets /*: string[] */ = [];
    if (
      typeof targetOrConditionsObject === 'object' &&
      targetOrConditionsObject != null
    ) {
      for (const [condition, target] of Object.entries(
        targetOrConditionsObject,
      )) {
        if (typeof target !== 'string') {
          throw new Error(
            `Invalid exports field in package.json for ${packageName}. ` +
              `exports["${subpath}"]["${condition}"] must be a string target.`,
          );
        }
        targets.push(target);
      }
    } else {
      if (typeof targetOrConditionsObject !== 'string') {
        throw new Error(
          `Invalid exports field in package.json for ${packageName}. ` +
            `exports["${subpath}"] must be a string target.`,
        );
      }
      targets.push(targetOrConditionsObject);
    }

    for (const target of targets) {
      // Skip non-JS files
      if (!target.endsWith('.js')) {
        continue;
      }

      if (target.includes('*')) {
        console.warn(
          `${chalk.yellow('Warning')}: Encountered subpath pattern ${subpath}` +
            ` in package.json exports for ${packageName}. Matched entry points ` +
            'will not be validated.',
        );
        continue;
      }

      // Normalize to original path if previously rewritten
      const original = normalizeExportsTarget(target);

      if (original.endsWith('.flow.js')) {
        throw new Error(
          `Package ${packageName} defines exports["${subpath}"] = "${original}". ` +
            'Expecting a .js wrapper file. See other monorepo packages for examples.',
        );
      }

      // Our special case for wrapper files that need to be stripped
      const resolvedTarget = path.resolve(PACKAGES_DIR, packageName, original);
      const resolvedFlowTarget = resolvedTarget.replace(/\.js$/, '.flow.js');

      try {
        await Promise.all([
          fs.access(resolvedTarget),
          fs.access(resolvedFlowTarget),
        ]);
      } catch {
        throw new Error(
          `${resolvedFlowTarget} does not exist when building ${packageName}.

From package.json exports["${subpath}"]:
  - found:   ${path.relative(REPO_ROOT, resolvedTarget)}
  - missing: ${path.relative(REPO_ROOT, resolvedFlowTarget)}

This is needed so users can directly import this entry point from the monorepo.`,
        );
      }

      entryPoints.add(resolvedFlowTarget);
    }
  }

  return entryPoints;
}

function getPackageName(file /*: string */) /*: string */ {
  return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file /*: string */) /*: string */ {
  const packageDir = path.join(PACKAGES_DIR, getPackageName(file));

  return path.join(
    packageDir,
    file
      .replace(path.join(packageDir, SRC_DIR), BUILD_DIR)
      .replace('.flow.js', '.js'),
  );
}

async function rewritePackageExports(packageName /*: string */) {
  const packageJsonPath = path.join(PACKAGES_DIR, packageName, 'package.json');
  const pkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

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

function normalizeExportsTarget(target /*: string */) /*: string */ {
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
  build().catch(error => {
    if (error.name === 'ExpectedTranslationError') {
      console.error(error.message);
    } else {
      console.error(error.stack);
    }
    process.exitCode = 1;
  });
}

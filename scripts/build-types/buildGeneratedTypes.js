/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {PACKAGES_DIR, REPO_ROOT} = require('../consts');
const {ENTRY_POINT, IGNORE_PATTERNS, TYPES_OUTPUT_DIR} = require('./config');
const getRequireStack = require('./resolution/getRequireStack');
const translatedModuleTemplate = require('./templates/translatedModule.d.ts-template');
const translateSourceFile = require('./translateSourceFile');
const {promises: fs} = require('fs');
const micromatch = require('micromatch');
const path = require('path');

/**
 * Build generated TypeScript types for react-native.
 *
 * Bundles the react-native package and its type dependencies into an output
 * directory of TypeScript definition files which will be published to npm.
 *
 * We translate Flow source code to TypeScript using
 * [flow-api-translator](https://www.npmjs.com/package/flow-api-translator)
 * along with our own pre and post-processing.
 */
async function buildGeneratedTypes(): Promise<void> {
  const files = new Set<string>([path.join(REPO_ROOT, ENTRY_POINT)]);
  const translatedFiles = new Set<string>();
  const dependencyEdges: DependencyEdges = [];
  const allErrors: Array<ModuleTranslationError> = [];

  while (files.size > 0) {
    const {dependencies, errors} = await translateSourceFiles(
      dependencyEdges,
      files,
    );
    dependencyEdges.push(...dependencies);
    allErrors.push(...errors);

    files.forEach(file => translatedFiles.add(file));
    files.clear();

    for (const [, dep] of dependencies) {
      if (
        !translatedFiles.has(dep) &&
        !IGNORE_PATTERNS.some(pattern => micromatch.isMatch(dep, pattern))
      ) {
        files.add(dep);
      }
    }
  }

  await Promise.all([
    fs.copyFile(
      path.join(__dirname, 'templates', 'tsconfig.json'),
      path.join(
        PACKAGES_DIR,
        'react-native',
        TYPES_OUTPUT_DIR,
        'tsconfig.json',
      ),
    ),
    fs.copyFile(
      path.join(__dirname, 'templates', 'tsconfig.test.json'),
      path.join(
        PACKAGES_DIR,
        'react-native',
        TYPES_OUTPUT_DIR,
        'tsconfig.test.json',
      ),
    ),
  ]);

  if (allErrors.length > 0) {
    process.exitCode = 1;
  }
}

type DependencyEdges = Array<[string, string]>;
type TranslateFilesResult = {
  dependencies: DependencyEdges,
  errors: Array<ModuleTranslationError>,
};

async function translateSourceFiles(
  dependencyEdges: DependencyEdges,
  inputFiles: Iterable<string>,
): Promise<TranslateFilesResult> {
  const files = new Set<string>([...inputFiles]);
  const dependencies: DependencyEdges = [];
  const errors: Array<ModuleTranslationError> = [];

  await Promise.all(
    Array.from(files).map(async file => {
      const buildPath = getBuildPath(file);
      const source = await fs.readFile(file, 'utf-8');

      try {
        const {result: typescriptDef, dependencies: fileDeps} =
          await translateSourceFile(source, file);

        for (const dep of fileDeps) {
          dependencies.push([file, dep]);
        }

        await fs.mkdir(path.dirname(buildPath), {recursive: true});
        await fs.writeFile(
          buildPath,
          translatedModuleTemplate({
            originalFileName: path.relative(REPO_ROOT, file),
            source: stripDocblock(typescriptDef),
            tripleSlashDirectives: extractTripleSlashDirectives(source),
          }),
        );
      } catch (e) {
        const error = new ModuleTranslationError(file, e);
        error.requireStack = getRequireStack(dependencyEdges, file);
        errors.push(error);
        console.error(error.formatError());
      }
    }),
  );

  return {dependencies, errors};
}

function getPackageName(file: string): string {
  return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file: string): string {
  const packageDir = path.join(PACKAGES_DIR, getPackageName(file));

  return path.join(
    packageDir,
    file
      .replace(packageDir, TYPES_OUTPUT_DIR)
      .replace(/\.js\.flow$/, '.js')
      .replace(/\.js$/, '.d.ts'),
  );
}

function stripDocblock(source: string): string {
  return source.replace(/\/\*\*[\s\S]*?\*\/\n/, '');
}

function extractTripleSlashDirectives(source: string): Array<string> {
  const directives = source.match(/^\/\/\/.*$/gm);

  if (directives == null) {
    return [];
  }

  return directives.map(directive => directive.replace(/^\/\/\//g, '').trim());
}

class ModuleTranslationError extends Error {
  requireStack: Array<string> = [];
  originalError: Error;

  constructor(filePath: string, originalError: Error) {
    super(`Failed to build ${path.relative(REPO_ROOT, filePath)}`);
    this.name = 'ModuleTranslationError';
    this.originalError = originalError;
  }

  formatError(): string {
    let output = `${this.name}: ${this.message}`;

    if (this.originalError?.stack != null) {
      output += `\n  ${this.originalError.stack}`;
    }

    if (this.requireStack.length > 0) {
      output += '\n  Require stack:';
      for (const stackEntry of this.requireStack) {
        output += `\n  - ${stackEntry}`;
      }
    }

    return output;
  }
}

module.exports = buildGeneratedTypes;

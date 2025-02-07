/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {DependencyContext} from './simpleResolve';
import type {ParseResult} from 'hermes-transform/dist/transform/parse';

const simpleResolve = require('./simpleResolve');
const debug = require('debug')('build-types:resolution');
const {traverse} = require('hermes-transform/dist/traverse/traverse');

const reportedUnresolvedDeps = new Set<string>();

/**
 * Extract the dependencies from a Flow source file.
 *
 * We only resolve dependencies local to the repo, otherwise returning each
 * original import path. See ./simpleResolve.js.
 */
async function getDependencies(
  preprocessedSource: ParseResult,
  filePath: string,
): Promise<Set<string>> {
  const importPaths = new Set<string>();

  traverse(
    preprocessedSource.code,
    preprocessedSource.ast,
    preprocessedSource.scopeManager,
    context => ({
      ImportDeclaration(node): void {
        importPaths.add(node.source.value);
      },
      VariableDeclaration(node): void {
        const maybeCallExpression = node.declarations[0].init;
        if (
          maybeCallExpression?.type === 'CallExpression' &&
          maybeCallExpression.callee?.name === 'require' &&
          maybeCallExpression.arguments[0]?.type === 'Literal'
        ) {
          const {value} = maybeCallExpression.arguments[0];

          if (typeof value === 'string') {
            importPaths.add(value);
          }
        }
      },
    }),
  );

  const dependencies = new Set<string>();
  const dependencyContext: DependencyContext = {
    reportUnresolvedDependency: importPath => {
      if (!reportedUnresolvedDeps.has(importPath)) {
        debug(`Unresolved dependency: '${importPath}' in ${filePath}`);
        reportedUnresolvedDeps.add(importPath);
      }
    },
  };

  await Promise.all(
    Array.from(importPaths).map(async importPath => {
      const resolved = await simpleResolve(
        importPath,
        filePath,
        dependencyContext,
      );

      if (resolved != null) {
        dependencies.add(resolved);
      }
    }),
  );

  return dependencies;
}

module.exports = getDependencies;

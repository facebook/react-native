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

const fs = require('fs');
const micromatch = require('micromatch');
const path = require('path');
const yaml = require('yaml');

/**
 * Get the workspace paths from the path of a potential workspace root.
 *
 * This supports:
 * - [NPM workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
 * - [Yarn workspaces](https://yarnpkg.com/features/workspaces)
 * - [PNPM workspaces](https://pnpm.io/workspaces)
 */
function getWorkspacePaths(packagePath /*: string */) /*: string[] */ {
  const result /*: string[] */ = [];
  try {
    const packageJsonPath = path.resolve(packagePath, 'package.json');
    const {workspaces} = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (Array.isArray(workspaces)) {
      result.push(...workspaces);
    } else if (
      typeof workspaces === 'object' &&
      Array.isArray(workspaces.packages)
    ) {
      // An alternative way for Yarn to declare workspace packages
      result.push(...workspaces.packages);
    }
    // Falling back to PNPN workspaces
    const pnpmWorkspacePath = path.resolve(packagePath, 'pnpm-workspace.yaml');
    const pnpmWorkspaceConfig = yaml.parse(
      fs.readFileSync(pnpmWorkspacePath, 'utf8'),
    );
    if (
      typeof pnpmWorkspaceConfig === 'object' &&
      Array.isArray(pnpmWorkspaceConfig.packages)
    ) {
      result.push(...pnpmWorkspaceConfig.packages);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`Failed getting workspace root from ${packagePath}:`, err);
    }
  } finally {
    return result;
  }
}

/**
 * Resolves the root of an NPM or Yarn workspace, by traversing the file tree upwards from a `candidatePath` in the search for
 * - a directory with a package.json
 * - which has a `workspaces` array of strings
 * - which (possibly via a glob) includes the project root
 */
export function getWorkspaceRoot(
  projectRoot /*: string */,
  candidatePath /*: string */ = projectRoot,
) /*: ?string */ {
  const workspacePaths = getWorkspacePaths(candidatePath);
  // If one of the workspaces match the project root, this is the workspace root
  // Note: While NPM workspaces doesn't currently support globs, Yarn does, which is why we use micromatch
  const relativePath = path.relative(candidatePath, projectRoot);
  // Using this instead of `micromatch.isMatch` to enable excluding patterns
  if (micromatch([relativePath], workspacePaths).length > 0) {
    return candidatePath;
  }
  // Try one level up
  const parentDir = path.dirname(candidatePath);
  if (parentDir !== candidatePath) {
    return getWorkspaceRoot(projectRoot, parentDir);
  } else {
    return null;
  }
}

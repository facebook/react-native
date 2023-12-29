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

/**
 * Get the workspace paths from the path of a potential workspace root.
 */
function getWorkspacePaths(packagePath /*: string */) /*: string[] */ {
  const packageJsonPath = path.resolve(packagePath, 'package.json');
  const {workspaces} = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (Array.isArray(workspaces)) {
    return workspaces;
  } else if (
    typeof workspaces === 'object' &&
    Array.isArray(workspaces.packages)
  ) {
    // An alternative way for Yarn to declare workspace packages
    return workspaces.packages;
  } else {
    return [];
  }
  // TODO: Support PNPN workspaces
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
  try {
    const workspacePaths = getWorkspacePaths(candidatePath);
    // If one of the workspaces match the project root, this is the workspace root
    // Note: While NPM workspaces doesn't currently support globs, Yarn does, which is why we use micromatch
    const relativePath = path.relative(candidatePath, projectRoot);
    if (micromatch.isMatch(relativePath, workspacePaths)) {
      return candidatePath;
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`Failed getting workspace root from ${candidatePath}:`, err);
    }
  }
  // Try one level up
  const parentDir = path.dirname(candidatePath);
  if (parentDir !== candidatePath) {
    return getWorkspaceRoot(projectRoot, parentDir);
  } else {
    return null;
  }
}

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

import {logger} from '@react-native-community/cli-tools';
import fs from 'fs';
import micromatch from 'micromatch';
import path from 'path';
import yaml from 'yaml';

/**
 * Get the workspace paths from the path of a potential workspace root.
 *
 * This supports:
 * - [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
 * - [yarn workspaces](https://yarnpkg.com/features/workspaces)
 * - [pnpm workspaces](https://pnpm.io/workspaces)
 */
function getWorkspacePaths(packagePath: string): Array<string> {
  try {
    // Checking pnpm workspaces first
    const pnpmWorkspacePath = path.resolve(packagePath, 'pnpm-workspace.yaml');
    if (fs.existsSync(pnpmWorkspacePath)) {
      const pnpmWorkspaceConfig = yaml.parse(
        fs.readFileSync(pnpmWorkspacePath, 'utf8'),
      );
      if (
        typeof pnpmWorkspaceConfig === 'object' &&
        Array.isArray(pnpmWorkspaceConfig.packages)
      ) {
        return pnpmWorkspaceConfig.packages;
      }
    }
    // Falling back to npm / yarn workspaces
    const packageJsonPath = path.resolve(packagePath, 'package.json');
    const {workspaces} = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (Array.isArray(workspaces)) {
      return workspaces;
    } else if (
      typeof workspaces === 'object' &&
      Array.isArray(workspaces.packages)
    ) {
      // An alternative way for yarn to declare workspace packages
      return workspaces.packages;
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.debug(`Failed getting workspace root from ${packagePath}: ${err}`);
    }
  }
  return [];
}

/**
 * Resolves the root of an npm or yarn workspace, by traversing the file tree
 * upwards from a `candidatePath` in the search for
 * - a directory with a package.json
 * - which has a `workspaces` array of strings
 * - which (possibly via a glob) includes the project root
 */
export function getWorkspaceRoot(
  projectRoot: string,
  candidatePath: string = projectRoot,
): ?string {
  const workspacePaths = getWorkspacePaths(candidatePath);
  // If one of the workspaces match the project root, this is the workspace root
  // Note: While npm workspaces doesn't currently support globs, yarn does, which is why we use micromatch
  const relativePath = path.relative(candidatePath, projectRoot);
  // Using this instead of `micromatch.isMatch` to enable excluding patterns
  if (micromatch([relativePath], workspacePaths).length > 0) {
    return candidatePath;
  }
  // Try one level up
  const parentDir = path.dirname(candidatePath);
  if (parentDir !== candidatePath) {
    return getWorkspaceRoot(projectRoot, parentDir);
  }
  return null;
}

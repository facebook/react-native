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

type DependencyEdges = Array<[string, string]>;

/**
 * Given a containing dependency graph and an input file, get the first
 * complete path found when traversing dependant module edges up to the root
 * entry file. Any require cycles will be pruned.
 *
 * Time complexity: O(edges^2)
 * Space complexity: O(edges)
 */
function getRequireStack(edges: DependencyEdges, file: string): Array<string> {
  const requireStack = new Set<string>();
  const cycleRoots = new Set<string>();
  let currentTarget = file;

  while (true) {
    const edge = edges.find(
      ([, targetFile]) =>
        targetFile === currentTarget && !cycleRoots.has(targetFile),
    );

    if (edge == null) {
      break;
    }

    const [sourceFile] = edge;

    if (requireStack.has(sourceFile)) {
      requireStack.clear();
      cycleRoots.add(sourceFile);
    }

    requireStack.add(sourceFile);
    currentTarget = sourceFile;
  }

  return Array.from(requireStack);
}

module.exports = getRequireStack;

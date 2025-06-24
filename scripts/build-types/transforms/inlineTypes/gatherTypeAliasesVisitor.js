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

import type {NodePath, Visitor} from '@babel/traverse';

const t = require('@babel/types');

export type GatherTypeAliasesVisitorState = {
  +aliasToPathMap: Map<string, NodePath<t.TSTypeAliasDeclaration>>,
  +aliasesToPrune: Set<string>,
};

/**
 * Gather all type aliases in the file into a map, and remove the ones that
 * are not exported.
 */
const gatherTypeAliasesVisitor: Visitor<GatherTypeAliasesVisitorState> = {
  TSTypeAliasDeclaration(path, state) {
    const alias = path.node.id.name;

    state.aliasToPathMap.set(alias, path);

    const isExported = path.findParent(p => p.isExportDeclaration());
    if (!isExported) {
      // If not exported, we add it to the set of aliases to prune.
      // If this alias is chosen to NOT be inlined at any point, it
      // will be removed from this set.
      state.aliasesToPrune.add(alias);
    }
  },
};

export default gatherTypeAliasesVisitor;

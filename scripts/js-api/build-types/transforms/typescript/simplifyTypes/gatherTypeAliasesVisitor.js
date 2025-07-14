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
};

/**
 * Gather all type aliases in the file into a map
 */
const gatherTypeAliasesVisitor: Visitor<GatherTypeAliasesVisitorState> = {
  TSTypeAliasDeclaration(path, state) {
    const alias = path.node.id.name;
    state.aliasToPathMap.set(alias, path);
  },
};

export default gatherTypeAliasesVisitor;

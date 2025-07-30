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

import type {BaseVisitorState, InlineVisitorState} from './visitorState';
import type {NodePath} from '@babel/traverse';

import {
  insideArrayLayer,
  insideExtendsLayer,
  insideKeyofLayer,
  insideOmitLayer,
  insideUnionLayer,
  insideUnresolvableTypeInstantiation,
} from './contextStack';

const t = require('@babel/types');

export function onNodeExit(state: BaseVisitorState, node: t.Node): void {
  // We're no longer inside the node if we remove it
  const alias = state.nodeToAliasMap?.get(node);
  if (alias !== undefined) {
    state.parentTypeAliases?.delete(alias);
  }
}

export function replaceWithCleanup(
  state: BaseVisitorState,
  path: NodePath<t.Node>,
  newNode: t.Node,
) {
  if (newNode === path.node) {
    // Nothing to do
    return;
  }

  // Treating `newNode` as a template, and instantiating it
  const clonedNewNode = t.cloneDeep(newNode);

  // We're removing the node, so let's treat it as if we're exiting it
  onNodeExit(state, path.node);

  path.replaceWith(clonedNewNode);
}

export function shouldSkipInliningType(
  state: InlineVisitorState,
  alias: string,
): boolean {
  // Type instantiations of types that are not resolvable
  if (insideUnresolvableTypeInstantiation(state)) {
    return true;
  }

  // Skipping inline of union/array types, except when inside keyof or omit
  if (
    (insideUnionLayer(state) ||
      insideArrayLayer(state) ||
      insideExtendsLayer(state)) &&
    !(insideKeyofLayer(state) || insideOmitLayer(state))
  ) {
    return true;
  }

  return false;
}

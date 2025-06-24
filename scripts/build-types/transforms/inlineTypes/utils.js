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

import type {VisitorState} from './visitorState';
import type {NodePath} from '@babel/traverse';

import {
  API_SNAPSHOT_ALIAS_INLINING_BLOCKLIST,
  API_SNAPSHOT_ALIAS_INLINING_BLOCKLIST_RECURSIVE,
} from '../../config';
import {
  insideArrayLayer,
  insideExtendsLayer,
  insideKeyofLayer,
  insideNoInlineLayer,
  insideOmitLayer,
  insideUnionLayer,
  insideUnresolvableTypeInstantiation,
} from './contextStack';

const t = require('@babel/types');

export function onNodeExit(state: VisitorState, node: t.Node): void {
  // We're no longer inside the node if we remove it
  const alias = state.nodeToAliasMap?.get(node);
  if (alias !== undefined) {
    state.parentTypeAliases?.delete(alias);
  }
}

export function replaceWithCleanup(
  state: VisitorState,
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

export function shouldSkipInliningRecursively(
  state: VisitorState,
  alias: string,
): boolean {
  return API_SNAPSHOT_ALIAS_INLINING_BLOCKLIST_RECURSIVE.has(alias);
}

export function shouldSkipInliningType(
  state: VisitorState,
  alias: string,
): boolean {
  // Explicit blocklist
  if (API_SNAPSHOT_ALIAS_INLINING_BLOCKLIST.has(alias)) {
    return true;
  }

  // Type instantiations of types that are not resolvable
  if (insideUnresolvableTypeInstantiation(state)) {
    return true;
  }

  // Inside of a type that's recursively blocked from inlining
  if (insideNoInlineLayer(state)) {
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

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

import type {InlineVisitorState} from './visitorState';
import type {NodePath} from '@babel/traverse';

import alignTypeParameters from './alignTypeParameters';

const t = require('@babel/types');
const debug = require('debug')('build-types:transforms:inlineTypes');

export default function inlineType(
  state: InlineVisitorState,
  path: NodePath<t.Node>,
  alias: string,
): void {
  const declarationPath = state.aliasToPathMap?.get(alias);

  if (!declarationPath) {
    debug(`No declaration found for ${alias ?? ''}`);
    return;
  }

  let cloned = t.cloneDeep(declarationPath.node.typeAnnotation);

  // If the inlined type is generic, align the provided type parameters
  // to the declaration
  if (declarationPath.node.typeParameters) {
    cloned = alignTypeParameters(cloned, declarationPath, path);
  }

  state.parentTypeAliases?.add(alias);
  state.nodeToAliasMap?.set(cloned, alias);
  path.replaceWith(cloned);
}

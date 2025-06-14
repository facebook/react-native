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

import {replaceWithCleanup} from './utils';

const t = require('@babel/types');
const debug = require('debug')('build-types:transforms:inlineTypes');

export function resolveIndexAccess(
  path: NodePath<t.TSIndexedAccessType>,
  state: VisitorState,
): void {
  const objectType = path.node.objectType;
  const indexType = path.node.indexType;

  if (!t.isTSTypeLiteral(objectType)) {
    debug(`Unsupported indexed access object type: ${objectType.type}`);
    return;
  }

  if (!t.isTSLiteralType(indexType) || !t.isStringLiteral(indexType.literal)) {
    debug(`Unsupported indexed access index type: ${indexType.type}`);
    return;
  }

  const indexKey = indexType.literal.value;
  const matchingMember = objectType.members.find(member => {
    if (
      t.isTSPropertySignature(member) &&
      t.isIdentifier(member.key) &&
      member.key.name === indexKey
    ) {
      return true;
    }
    if (
      t.isTSPropertySignature(member) &&
      t.isStringLiteral(member.key) &&
      member.key.value === indexKey
    ) {
      return true;
    }
    return false;
  });

  if (!matchingMember) {
    debug(`No member found for index key: ${indexKey}`);
    return;
  }

  const typeAnnotation = matchingMember.typeAnnotation?.typeAnnotation;
  if (!typeAnnotation) {
    debug(`No type annotation found for member: ${indexKey}`);
    return;
  }

  replaceWithCleanup(state, path, t.cloneDeep(typeAnnotation));
  path.skip(); // We don't want to traverse the new node
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type ReadOnlyElement from '../ReadOnlyElement';
import type ReadOnlyNode from '../ReadOnlyNode';

import {getChildNodes} from '../ReadOnlyNode';

// We initialize this lazily to avoid a require cycle
// (`ReadOnlyElement` also depends on `Traversal`).
let ReadOnlyElementClass: Class<ReadOnlyElement>;

export function getElementSibling(
  node: ReadOnlyNode,
  direction: 'next' | 'previous',
): ReadOnlyElement | null {
  const parent = node.parentNode;
  if (parent == null) {
    // This node is the root or it's disconnected.
    return null;
  }

  const childNodes = getChildNodes(parent);

  const startPosition = childNodes.indexOf(node);
  if (startPosition === -1) {
    return null;
  }

  const increment = direction === 'next' ? 1 : -1;

  let position = startPosition + increment;

  if (ReadOnlyElementClass == null) {
    // We initialize this lazily to avoid a require cycle.
    ReadOnlyElementClass = require('../ReadOnlyElement').default;
  }

  while (
    childNodes[position] != null &&
    !(childNodes[position] instanceof ReadOnlyElementClass)
  ) {
    position = position + increment;
  }

  return childNodes[position] ?? null;
}

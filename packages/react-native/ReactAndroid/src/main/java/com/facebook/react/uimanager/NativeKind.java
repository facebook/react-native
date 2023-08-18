/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

// Common conditionals:
//   - `kind == PARENT` checks whether the node can host children in the native tree.
//   - `kind != NONE` checks whether the node appears in the native tree.

public enum NativeKind {
  // Node is in the native hierarchy and the HierarchyOptimizer should assume it can host children
  // (e.g. because it's a ViewGroup). Note that it's okay if the node doesn't support children. When
  // the HierarchyOptimizer generates children manipulation commands for that node, the
  // HierarchyManager will catch this case and throw an exception.
  PARENT,
  // Node is in the native hierarchy, it may have children, but it cannot host them itself (e.g.
  // because it isn't a ViewGroup). Consequently, its children need to be hosted by an ancestor.
  LEAF,
  // Node is not in the native hierarchy.
  NONE
}

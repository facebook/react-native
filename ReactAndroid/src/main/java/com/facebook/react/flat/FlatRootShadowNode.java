/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

/**
 * Root node of the shadow node hierarchy. Currently, the only node that can actually map to a View.
 */
/* package */ final class FlatRootShadowNode extends FlatShadowNode {

  /* package */ FlatRootShadowNode() {
    forceMountToView();
    signalBackingViewIsCreated();
  }
}

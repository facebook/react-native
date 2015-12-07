/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import android.text.SpannableStringBuilder;

import com.facebook.react.uimanager.ReactShadowNode;

/**
 * Base class for RCTVirtualText and RCTRawText.
 */
/* package */ abstract class FlatTextShadowNode extends FlatShadowNode {

  /**
   * Recursively visits FlatTextShadowNode and its children,
   * appending text to SpannableStringBuilder.
   */
  protected abstract void collectText(SpannableStringBuilder builder);

  /**
   * Recursively visits FlatTextShadowNode and its children,
   * applying spans to SpannableStringBuilder.
   */
  protected abstract void applySpans(SpannableStringBuilder builder);

  /**
   * Propagates changes up to RCTText without dirtying current node.
   */
  protected void notifyChanged(boolean shouldRemeasure) {
    ReactShadowNode parent = getParent();
    if (parent instanceof FlatTextShadowNode) {
      ((FlatTextShadowNode) parent).notifyChanged(shouldRemeasure);
    }
  }

  @Override
  public boolean isVirtual() {
    return true;
  }
}

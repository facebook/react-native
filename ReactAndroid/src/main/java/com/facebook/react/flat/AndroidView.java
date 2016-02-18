/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import com.facebook.csslayout.Spacing;

interface AndroidView {

  /**
   * Whether or not custom layout is needed for the children
   * @return a boolean representing whether custom layout is needed
   */
  boolean needsCustomLayoutForChildren();

  /**
   * Did the padding change
   * @return a boolean representing whether the padding changed
   */
  boolean isPaddingChanged();

  /**
   * Reset the padding changed internal state
   */
  void resetPaddingChanged();

  /**
   * Get this node's padding, as defined by style + default padding.
   */
  Spacing getPadding();
}

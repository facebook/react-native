/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

public interface IViewManagerWithChildren {
  /**
   * Returns whether this View type needs to handle laying out its own children instead of
   * deferring to the standard css-layout algorithm.
   * Returns true for the layout to *not* be automatically invoked. Instead onLayout will be
   * invoked as normal and it is the View instance's responsibility to properly call layout on its
   * children.
   * Returns false for the default behavior of automatically laying out children without going
   * through the ViewGroup's onLayout method. In that case, onLayout for this View type must *not*
   * call layout on its children.
   */
  public boolean needsCustomLayoutForChildren();
}

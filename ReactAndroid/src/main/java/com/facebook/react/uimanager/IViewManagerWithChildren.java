/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.uimanager;

public interface IViewManagerWithChildren {
  /**
   * Returns whether this View type needs to handle laying out its own children instead of deferring
   * to the standard css-layout algorithm. Returns true for the layout to *not* be automatically
   * invoked. Instead onLayout will be invoked as normal and it is the View instance's
   * responsibility to properly call layout on its children. Returns false for the default behavior
   * of automatically laying out children without going through the ViewGroup's onLayout method. In
   * that case, onLayout for this View type must *not* call layout on its children.
   */
  public boolean needsCustomLayoutForChildren();
}

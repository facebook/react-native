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
 * An interface that DrawCommands need to implement into order to receive
 * {@link android.view.View#onAttachedToWindow()} and
 * {@link android.view.View#onDetachedFromWindow()} events.
 */
/* package */ interface AttachDetachListener {
  public static final AttachDetachListener[] EMPTY_ARRAY = new AttachDetachListener[0];

  /**
   * Called when a DrawCommand is being attached to a visible View hierarchy.
   * @param callback a WeakReference to a View that provides invalidate() helper method.
   */
  public void onAttached(FlatViewGroup.InvalidateCallback callback);

  /**
   * Called when a DrawCommand is being detached from a visible View hierarchy.
   */
  public void onDetached();
}

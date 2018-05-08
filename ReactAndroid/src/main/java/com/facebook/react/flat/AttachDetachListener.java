/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

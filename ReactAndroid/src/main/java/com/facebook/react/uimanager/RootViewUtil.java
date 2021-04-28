/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.graphics.Point;
import android.graphics.Rect;
import android.view.View;
import android.view.ViewParent;
import androidx.annotation.UiThread;
import com.facebook.infer.annotation.Assertions;

public class RootViewUtil {

  /** Returns the root view of a given view in a react application. */
  public static RootView getRootView(View reactView) {
    View current = reactView;
    while (true) {
      if (current instanceof RootView) {
        return (RootView) current;
      }
      ViewParent next = current.getParent();
      if (next == null) {
        return null;
      }
      Assertions.assertCondition(next instanceof View);
      current = (View) next;
    }
  }

  @UiThread
  public static Point getViewportOffset(View v) {
    int[] locationInWindow = new int[2];
    v.getLocationInWindow(locationInWindow);

    // we need to subtract visibleWindowCoords - to subtract possible window insets, split
    // screen or multi window
    Rect visibleWindowFrame = new Rect();
    v.getWindowVisibleDisplayFrame(visibleWindowFrame);
    locationInWindow[0] -= visibleWindowFrame.left;
    locationInWindow[1] -= visibleWindowFrame.top;

    return new Point(locationInWindow[0], locationInWindow[1]);
  }
}

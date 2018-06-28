/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.View;
import android.view.ViewParent;

import com.facebook.infer.annotation.Assertions;

public class RootViewUtil {

  /**
   * Returns the root view of a given view in a react application.
   */
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
}

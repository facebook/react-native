/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

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

/**
 * #{@link ReactHitTestView} can be implemented by ${@link ViewGroup} subclasses that wish to
 * specify which view should be the target of a touch events that occurs within it's bounds.
 */
public interface ReactHitTestView {
  /**
   * Given the x and y coordinates of the touch relative to this view, return the view that should
   * be the target.
   */
  View hitTest(float[] coordinates);
}

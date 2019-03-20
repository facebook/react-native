/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

public interface ScrollWatcher {
  public void onScrollChanged(int horiz, int vert, int oldHoriz, int oldVert);
}

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core;

import android.view.Choreographer;

public class ChoreographerCompat {
  /**
   * @deprecated Use Choreographer.FrameCallback instead
   */
  @Deprecated
  public abstract static class FrameCallback implements Choreographer.FrameCallback {}
}

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core

import android.view.Choreographer

public open class ChoreographerCompat {

  @Deprecated("Use Choreographer.FrameCallback instead")
  public abstract class FrameCallback : Choreographer.FrameCallback
}

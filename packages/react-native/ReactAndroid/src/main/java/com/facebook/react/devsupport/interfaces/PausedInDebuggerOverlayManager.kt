/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces

public interface PausedInDebuggerOverlayManager {
  /** Shows the "paused in debugger" overlay with the given message. */
  public fun showPausedInDebuggerOverlay(
      message: String,
      listener: DevSupportManager.PausedInDebuggerOverlayCommandListener,
  )

  /** Hides the "paused in debugger" overlay, if currently shown. */
  public fun hidePausedInDebuggerOverlay()
}

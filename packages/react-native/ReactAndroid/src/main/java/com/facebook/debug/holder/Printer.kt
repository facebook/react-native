/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.debug.holder

import com.facebook.debug.debugoverlay.model.DebugOverlayTag

/** Interface to debugging tool. */
public interface Printer {

  public fun logMessage(tag: DebugOverlayTag, message: String, vararg args: Any?)

  public fun logMessage(tag: DebugOverlayTag, message: String)

  public fun shouldDisplayLogMessage(tag: DebugOverlayTag): Boolean
}

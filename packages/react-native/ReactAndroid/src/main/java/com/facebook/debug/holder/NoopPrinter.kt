/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.debug.holder

import com.facebook.debug.debugoverlay.model.DebugOverlayTag

/** No-op implementation of [Printer]. */
internal object NoopPrinter : Printer {

  override fun logMessage(tag: DebugOverlayTag, message: String, vararg args: Any?): Unit = Unit

  override fun logMessage(tag: DebugOverlayTag, message: String): Unit = Unit

  override fun shouldDisplayLogMessage(tag: DebugOverlayTag): Boolean = false
}

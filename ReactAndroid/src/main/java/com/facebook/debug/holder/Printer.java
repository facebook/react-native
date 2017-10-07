// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.debug.holder;

import com.facebook.debug.debugoverlay.model.DebugOverlayTag;

/** Interface to debugging tool. */
public interface Printer {

  void logMessage(final DebugOverlayTag tag, final String message, Object... args);
  void logMessage(final DebugOverlayTag tag, final String message);
  boolean shouldDisplayLogMessage(final DebugOverlayTag tag);
}

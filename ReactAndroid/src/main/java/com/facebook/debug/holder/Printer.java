// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.debug.holder;

import com.facebook.debug.debugoverlay.model.DebugOverlayTag;

/** Interface to pass data to debugging tools. */
public interface Printer {

  void logMessage(final DebugOverlayTag tag, final String message, Object... args);

  void logMessage(final DebugOverlayTag tag, final String message);
}

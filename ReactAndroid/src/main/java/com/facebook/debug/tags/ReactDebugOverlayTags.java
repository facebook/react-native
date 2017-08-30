// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.debug.tags;

import android.graphics.Color;
import com.facebook.debug.debugoverlay.DebugOverlayTag;

/** Category for debug overlays. */
public class ReactDebugOverlayTags {

  public static final DebugOverlayTag PERFORMANCE =
      new DebugOverlayTag("Performance", "Markers for Performance", Color.GREEN);
}

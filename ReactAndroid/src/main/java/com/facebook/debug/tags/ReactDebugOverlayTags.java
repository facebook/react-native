// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.debug.tags;

import android.graphics.Color;
import com.facebook.debug.debugoverlay.model.DebugOverlayTag;

/** Category for debug overlays. */
public class ReactDebugOverlayTags {

  public static final DebugOverlayTag PERFORMANCE =
      new DebugOverlayTag("Performance", "Markers for Performance", Color.GREEN);
  public static final DebugOverlayTag NAVIGATION =
      new DebugOverlayTag("Navigation", "Tag for navigation", Color.rgb(0x9C, 0x27, 0xB0));
  public static final DebugOverlayTag RN_CORE =
      new DebugOverlayTag("RN Core", "Tag for React Native Core", Color.BLACK);
  public static final DebugOverlayTag BRIDGE_CALLS =
      new DebugOverlayTag(
          "Bridge Calls", "JS to Java calls (warning: this is spammy)", Color.MAGENTA);
  public static final DebugOverlayTag NATIVE_MODULE =
      new DebugOverlayTag("Native Module", "Native Module init", Color.rgb(0x80, 0x00, 0x80));
  public static final DebugOverlayTag UI_MANAGER =
      new DebugOverlayTag(
          "UI Manager",
          "UI Manager View Operations (requires restart\nwarning: this is spammy)",
          Color.CYAN);
  public static final DebugOverlayTag FABRIC_UI_MANAGER =
    new DebugOverlayTag(
      "FabricUIManager",
      "Fabric UI Manager View Operations",
      Color.CYAN);
  public static final DebugOverlayTag FABRIC_RECONCILER =
    new DebugOverlayTag(
      "FabricReconciler",
      "Reconciler for Fabric",
      Color.CYAN);
  public static final DebugOverlayTag RELAY =
      new DebugOverlayTag("Relay", "including prefetching", Color.rgb(0xFF, 0x99, 0x00));
}

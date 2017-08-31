// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.debug.debugoverlay;

import javax.annotation.concurrent.Immutable;

/** Tag for a debug overlay log message. Name must be unique. */
@Immutable
public class DebugOverlayTag {

  /** Name of tag. */
  public final String name;

  /** Description to display in settings. */
  public final String description;

  /** Color for tag display. */
  public final int color;

  public DebugOverlayTag(String name, String description, int color) {
    this.name = name;
    this.description = description;
    this.color = color;
  }
}

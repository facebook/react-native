// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.debug.debugoverlay.model;

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

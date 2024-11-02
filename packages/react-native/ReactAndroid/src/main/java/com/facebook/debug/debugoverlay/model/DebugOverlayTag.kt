/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.debug.debugoverlay.model

import javax.annotation.concurrent.Immutable

/** Tag for a debug overlay log message. Name must be unique.  */
@Immutable
public class DebugOverlayTag public constructor(
    /** Name of tag.  */
    public val name: String,
    /** Description to display in settings.  */
    public val description: String,
    /** Color for tag display.  */
    public val color: Int
)

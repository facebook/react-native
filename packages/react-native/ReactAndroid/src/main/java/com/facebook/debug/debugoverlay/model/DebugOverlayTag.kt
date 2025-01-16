/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.debug.debugoverlay.model

/**
 * Tag for a debug overlay log message. Name must be unique.
 *
 * @param name Name of tag.
 * @param description Description to display in settings.
 * @param color Color for tag display.
 */
internal class DebugOverlayTag(
    public val name: String,
    public val description: String,
    public val color: Int,
)

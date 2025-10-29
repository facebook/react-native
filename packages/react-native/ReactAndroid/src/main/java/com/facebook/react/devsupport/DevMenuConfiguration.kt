/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import com.facebook.react.BuildConfig

/** Configuration for enabling/disabling the dev menu. */
public class DevMenuConfiguration(
    /** whether the dev menu is enabled at all */
    public val devMenuEnabled: Boolean = BuildConfig.DEBUG,
    /** whether opening the dev menu with a shake gesture is enabled */
    public val shakeGestureEnabled: Boolean = true,
    /** whether opening the dev menu with a keyboard shortcut is enabled */
    public val keyboardShortcutsEnabled: Boolean = true,
)

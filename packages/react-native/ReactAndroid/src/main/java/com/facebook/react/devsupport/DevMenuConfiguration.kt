/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 package com.facebook.react.devsupport

import com.facebook.react.BuildConfig


public data class DevMenuConfiguration(
  val isDevMenuEnabled: Boolean = BuildConfig.DEBUG,
  val isShakeGestureEnabled: Boolean = true,
  val areKeyboardShortcutsEnabled: Boolean = true,
)

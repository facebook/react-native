/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.common.annotations.internal.LegacyArchitecture

@LegacyArchitecture
public enum class MemoryPressure {
  UI_HIDDEN,
  MODERATE,
  CRITICAL
}

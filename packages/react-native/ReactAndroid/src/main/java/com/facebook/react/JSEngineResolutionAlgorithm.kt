/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.common.annotations.internal.LegacyArchitecture

/**
 * An enum that specifies the algorithm to use when loading theJS Engine. [.JSC] will load
 * JavaScriptCore first and fail if it is not available. [.HERMES] will load Hermes first and fail
 * if it is not available.
 */
@LegacyArchitecture
public enum class JSEngineResolutionAlgorithm {
  JSC,
  HERMES
}

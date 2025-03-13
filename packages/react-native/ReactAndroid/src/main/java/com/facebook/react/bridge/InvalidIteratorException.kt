/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/**
 * Exception thrown by [ReadableMapKeySetIterator.nextKey] when the iterator tries to iterate over
 * elements after the end of the key set.
 */
@DoNotStrip
@LegacyArchitecture
public class InvalidIteratorException @DoNotStrip public constructor(msg: String) :
    RuntimeException(msg) {
  private companion object {
    init {
      LegacyArchitectureLogger.assertWhenLegacyArchitectureMinifyingEnabled(
          "InvalidIteratorException")
    }
  }
}

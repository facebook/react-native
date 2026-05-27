/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal

import com.facebook.systrace.Systrace

/**
 * Helper to guarantee firing Systrace begin and end markers around a try with resources statement.
 */
internal class SystraceSection(sectionName: String) : AutoCloseable {
  init {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, sectionName)
  }

  override fun close() {
    Systrace.endSection(Systrace.TRACE_TAG_REACT)
  }
}

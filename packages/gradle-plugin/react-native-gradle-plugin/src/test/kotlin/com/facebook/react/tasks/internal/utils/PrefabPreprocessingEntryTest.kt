/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal.utils

import groovy.test.GroovyTestCase.assertEquals
import org.junit.Test

class PrefabPreprocessingEntryTest {

  @Test
  fun secondaryConstructor_createsAList() {
    val sampleEntry =
        PrefabPreprocessingEntry(
            libraryName = "justALibrary", pathToPrefixCouple = "aPath" to "andAPrefix")

    assertEquals(1, sampleEntry.pathToPrefixCouples.size)
    assertEquals("aPath", sampleEntry.pathToPrefixCouples[0].first)
    assertEquals("andAPrefix", sampleEntry.pathToPrefixCouples[0].second)
  }
}

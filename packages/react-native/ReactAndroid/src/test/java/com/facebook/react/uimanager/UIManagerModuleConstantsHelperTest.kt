/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class UIManagerModuleConstantsHelperTest {
  @Test
  fun normalizeEventTypes_withNull_doesNothing() {
    UIManagerModuleConstantsHelper.normalizeEventTypes(null)
  }

  @Test
  fun normalizeEventTypes_withEmptyMap_doesNothing() {
    val emptyMap = mutableMapOf<String, Any?>()
    UIManagerModuleConstantsHelper.normalizeEventTypes(emptyMap)
    assertThat(emptyMap.isEmpty()).isTrue()
  }

  @Test
  fun normalizeEventTypes_withOnEvent_doesNormalize() {
    val onClickMap = mutableMapOf("onClick" to "¯\\_(ツ)_/¯")
    UIManagerModuleConstantsHelper.normalizeEventTypes(onClickMap)
    assertThat(onClickMap).containsKeys("topClick", "onClick")
  }

  @Test
  fun normalizeEventTypes_withTopEvent_doesNormalize() {
    val onClickMap = mutableMapOf("topOnClick" to "¯\\_(ツ)_/¯")
    UIManagerModuleConstantsHelper.normalizeEventTypes(onClickMap)
    assertThat(onClickMap).containsKey("topOnClick").doesNotContainKey("onClick")
  }

  @Suppress("UNCHECKED_CAST")
  @Test
  fun normalizeEventTypes_withNestedObjects_doesNotLoseThem() {
    val nestedObjects =
        mutableMapOf(
            "onColorChanged" to
                mutableMapOf(
                    "phasedRegistrationNames" to
                        mutableMapOf(
                            "bubbled" to "onColorChanged",
                            "captured" to "onColorChangedCapture",
                        )))
    UIManagerModuleConstantsHelper.normalizeEventTypes(nestedObjects)
    assertThat(nestedObjects).containsKey("topColorChanged")
    var innerMap = nestedObjects["topColorChanged"]
    assertThat(innerMap).isNotNull()
    requireNotNull(innerMap)
    assertThat(innerMap).containsKey("phasedRegistrationNames")
    var innerInnerMap = innerMap["phasedRegistrationNames"]
    assertThat(innerInnerMap).isNotNull()
    requireNotNull(innerInnerMap)
    assertThat("onColorChanged").isEqualTo(innerInnerMap["bubbled"])
    assertThat("onColorChangedCapture").isEqualTo(innerInnerMap["captured"])
    assertThat(nestedObjects).containsKey("onColorChanged")
    innerMap = nestedObjects["topColorChanged"]
    assertThat(innerMap).isNotNull()
    requireNotNull(innerMap)
    assertThat(innerMap).containsKey("phasedRegistrationNames")
    innerInnerMap = innerMap["phasedRegistrationNames"]
    assertThat(innerInnerMap).isNotNull()
    requireNotNull(innerInnerMap)
    assertThat("onColorChanged").isEqualTo(innerInnerMap["bubbled"])
    assertThat("onColorChangedCapture").isEqualTo(innerInnerMap["captured"])
  }
}

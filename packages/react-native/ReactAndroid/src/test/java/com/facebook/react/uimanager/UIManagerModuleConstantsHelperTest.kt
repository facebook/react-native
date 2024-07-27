/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.common.MapBuilder
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class UIManagerModuleConstantsHelperTest {
  @Test
  fun normalizeEventTypes_withNull_doesNothing() {
    UIManagerModuleConstantsHelper.normalizeEventTypes(null)
  }

  @Test
  fun normalizeEventTypes_withEmptyMap_doesNothing() {
    val emptyMap: Map<String, Any?> = MapBuilder.builder<String, Any?>().build()
    UIManagerModuleConstantsHelper.normalizeEventTypes(emptyMap)
    assertThat(emptyMap.isEmpty()).isTrue()
  }

  @Test
  fun normalizeEventTypes_withOnEvent_doesNormalize() {
    val onClickMap: Map<String, String> =
        MapBuilder.builder<String, String>().put("onClick", "¯\\_(ツ)_/¯").build()
    UIManagerModuleConstantsHelper.normalizeEventTypes(onClickMap)
    assertThat(onClickMap).containsKeys("topClick", "onClick")
  }

  @Test
  fun normalizeEventTypes_withTopEvent_doesNormalize() {
    val onClickMap: Map<String, String> =
        MapBuilder.builder<String, String>().put("topOnClick", "¯\\_(ツ)_/¯").build()
    UIManagerModuleConstantsHelper.normalizeEventTypes(onClickMap)
    assertThat(onClickMap).containsKey("topOnClick").doesNotContainKey("onClick")
  }

  @Suppress("UNCHECKED_CAST")
  @Test
  fun normalizeEventTypes_withNestedObjects_doesNotLoseThem() {
    val nestedObjects: Map<String, Any?> =
        MapBuilder.builder<String, Any?>()
            .put(
                "onColorChanged",
                MapBuilder.of<String, Any?>(
                    "phasedRegistrationNames",
                    MapBuilder.of<String, String>(
                        "bubbled", "onColorChanged", "captured", "onColorChangedCapture")))
            .build()
    UIManagerModuleConstantsHelper.normalizeEventTypes(nestedObjects)
    assertThat(nestedObjects).containsKey("topColorChanged")
    var innerMap = nestedObjects["topColorChanged"] as? Map<String, Any?>
    assertThat(innerMap).isNotNull()
    requireNotNull(innerMap)
    assertThat(innerMap).containsKey("phasedRegistrationNames")
    var innerInnerMap = innerMap["phasedRegistrationNames"] as? Map<String, Any?>
    assertThat(innerInnerMap).isNotNull()
    requireNotNull(innerInnerMap)
    assertThat("onColorChanged").isEqualTo(innerInnerMap["bubbled"])
    assertThat("onColorChangedCapture").isEqualTo(innerInnerMap["captured"])
    assertThat(nestedObjects).containsKey("onColorChanged")
    innerMap = nestedObjects["topColorChanged"] as? Map<String, Any?>
    assertThat(innerMap).isNotNull()
    requireNotNull(innerMap)
    assertThat(innerMap).containsKey("phasedRegistrationNames")
    innerInnerMap = innerMap["phasedRegistrationNames"] as? Map<String, Any?>
    assertThat(innerInnerMap).isNotNull()
    requireNotNull(innerInnerMap)
    assertThat("onColorChanged").isEqualTo(innerInnerMap["bubbled"])
    assertThat("onColorChangedCapture").isEqualTo(innerInnerMap["captured"])
  }
}

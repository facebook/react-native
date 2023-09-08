/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.common.MapBuilder
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
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
    assertTrue(emptyMap.isEmpty())
  }

  @Test
  fun normalizeEventTypes_withOnEvent_doesNormalize() {
    val onClickMap: Map<String, String> =
        MapBuilder.builder<String, String>().put("onClick", "¯\\_(ツ)_/¯").build()
    UIManagerModuleConstantsHelper.normalizeEventTypes(onClickMap)
    assertTrue(onClickMap.containsKey("topOnClick"))
    assertTrue(onClickMap.containsKey("onClick"))
  }

  @Test
  fun normalizeEventTypes_withTopEvent_doesNormalize() {
    val onClickMap: Map<String, String> =
        MapBuilder.builder<String, String>().put("topOnClick", "¯\\_(ツ)_/¯").build()
    UIManagerModuleConstantsHelper.normalizeEventTypes(onClickMap)
    assertTrue(onClickMap.containsKey("topOnClick"))
    assertFalse(onClickMap.containsKey("onClick"))
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
    assertTrue(nestedObjects.containsKey("topOnColorChanged"))
    var innerMap = nestedObjects["topOnColorChanged"] as? Map<String, Any?>
    assertNotNull(innerMap)
    assertTrue(innerMap!!.containsKey("phasedRegistrationNames"))
    var innerInnerMap = innerMap.get("phasedRegistrationNames") as? Map<String, Any?>
    assertNotNull(innerInnerMap)
    assertEquals("onColorChanged", innerInnerMap!!.get("bubbled"))
    assertEquals("onColorChangedCapture", innerInnerMap.get("captured"))
    assertTrue(nestedObjects.containsKey("onColorChanged"))
    innerMap = nestedObjects.get("topOnColorChanged") as? Map<String, Any?>
    assertNotNull(innerMap)
    assertTrue(innerMap!!.containsKey("phasedRegistrationNames"))
    innerInnerMap = innerMap.get("phasedRegistrationNames") as? Map<String, Any?>
    assertNotNull(innerInnerMap)
    assertEquals("onColorChanged", innerInnerMap!!.get("bubbled"))
    assertEquals("onColorChangedCapture", innerInnerMap.get("captured"))
  }
}

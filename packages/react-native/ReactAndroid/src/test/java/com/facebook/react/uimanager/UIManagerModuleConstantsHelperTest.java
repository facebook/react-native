/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.facebook.react.common.MapBuilder;
import java.util.Map;
import org.junit.Test;

public class UIManagerModuleConstantsHelperTest {

  @Test
  public void normalizeEventTypes_withNull_doesNothing() {
    UIManagerModuleConstantsHelper.normalizeEventTypes(null);
  }

  @Test
  public void normalizeEventTypes_withEmptyMap_doesNothing() {
    Map<Object, Object> emptyMap = MapBuilder.builder().build();

    UIManagerModuleConstantsHelper.normalizeEventTypes(emptyMap);

    assertTrue(emptyMap.isEmpty());
  }

  @Test
  public void normalizeEventTypes_withOnEvent_doesNormalize() {
    Map<Object, Object> onClickMap = MapBuilder.builder().put("onClick", "¯\\_(ツ)_/¯").build();

    UIManagerModuleConstantsHelper.normalizeEventTypes(onClickMap);

    assertTrue(onClickMap.containsKey("topOnClick"));
    assertTrue(onClickMap.containsKey("onClick"));
  }

  @Test
  public void normalizeEventTypes_withTopEvent_doesNormalize() {
    Map<Object, Object> onClickMap = MapBuilder.builder().put("topOnClick", "¯\\_(ツ)_/¯").build();

    UIManagerModuleConstantsHelper.normalizeEventTypes(onClickMap);

    assertTrue(onClickMap.containsKey("topOnClick"));
    assertFalse(onClickMap.containsKey("onClick"));
  }

  @SuppressWarnings("unchecked")
  @Test
  public void normalizeEventTypes_withNestedObjects_doesNotLoseThem() {
    Map<String, Object> nestedObjects =
        MapBuilder.<String, Object>builder()
            .put(
                "onColorChanged",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of(
                        "bubbled", "onColorChanged", "captured", "onColorChangedCapture")))
            .build();

    UIManagerModuleConstantsHelper.normalizeEventTypes(nestedObjects);

    assertTrue(nestedObjects.containsKey("topOnColorChanged"));
    Map<String, Object> innerMap = (Map<String, Object>) nestedObjects.get("topOnColorChanged");
    assertNotNull(innerMap);
    assertTrue(innerMap.containsKey("phasedRegistrationNames"));
    Map<String, Object> innerInnerMap =
        (Map<String, Object>) innerMap.get("phasedRegistrationNames");
    assertNotNull(innerInnerMap);
    assertEquals("onColorChanged", innerInnerMap.get("bubbled"));
    assertEquals("onColorChangedCapture", innerInnerMap.get("captured"));

    assertTrue(nestedObjects.containsKey("onColorChanged"));
    innerMap = (Map<String, Object>) nestedObjects.get("topOnColorChanged");
    assertNotNull(innerMap);
    assertTrue(innerMap.containsKey("phasedRegistrationNames"));
    innerInnerMap = (Map<String, Object>) innerMap.get("phasedRegistrationNames");
    assertNotNull(innerInnerMap);
    assertEquals("onColorChanged", innerInnerMap.get("bubbled"));
    assertEquals("onColorChangedCapture", innerInnerMap.get("captured"));
  }
}

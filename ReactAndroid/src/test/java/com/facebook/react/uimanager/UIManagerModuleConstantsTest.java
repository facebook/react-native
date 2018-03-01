/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.events.EventDispatcher;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.fest.assertions.data.MapEntry;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class UIManagerModuleConstantsTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private static final String CUSTOM_BUBBLING_EVENT_TYPES = "customBubblingEventTypes";
  private static final String CUSTOM_DIRECT_EVENT_TYPES = "customDirectEventTypes";

  private static final Map TWIRL_BUBBLING_EVENT_MAP = MapBuilder.of(
      "phasedRegistrationNames",
      MapBuilder.of(
          "bubbled",
          "onTwirl",
          "captured",
          "onTwirlCaptured"));
  private static final Map TWIRL_DIRECT_EVENT_MAP = MapBuilder.of("registrationName", "onTwirl");

  private ReactApplicationContext mReactContext;
  private UIImplementationProvider mUIImplementationProvider;

  @Before
  public void setUp() {
    mReactContext = new ReactApplicationContext(RuntimeEnvironment.application);
    mUIImplementationProvider = mock(UIImplementationProvider.class);
    when(mUIImplementationProvider.createUIImplementation(
            any(ReactApplicationContext.class),
            any(List.class),
            any(EventDispatcher.class),
            anyInt()))
        .thenReturn(mock(UIImplementation.class));
  }

  @Test
  public void testNoCustomConstants() {
    List<ViewManager> viewManagers = Arrays.asList(mock(ViewManager.class));
    UIManagerModule uiManagerModule =
        new UIManagerModule(mReactContext, viewManagers, mUIImplementationProvider, 0);
    Map<String, Object> constants = uiManagerModule.getConstants();
    assertThat(constants)
        .containsKey(CUSTOM_BUBBLING_EVENT_TYPES)
        .containsKey(CUSTOM_DIRECT_EVENT_TYPES)
        .containsKey("Dimensions");
  }

  @Test
  public void testCustomBubblingEvents() {
    ViewManager mockViewManager = mock(ViewManager.class);
    List<ViewManager> viewManagers = Arrays.asList(mockViewManager);
    when(mockViewManager.getExportedCustomBubblingEventTypeConstants())
        .thenReturn(MapBuilder.of("onTwirl", TWIRL_BUBBLING_EVENT_MAP));
    UIManagerModule uiManagerModule =
        new UIManagerModule(mReactContext, viewManagers, mUIImplementationProvider, 0);
    Map<String, Object> constants = uiManagerModule.getConstants();
    assertThat((Map) constants.get(CUSTOM_BUBBLING_EVENT_TYPES))
        .contains(MapEntry.entry("onTwirl", TWIRL_BUBBLING_EVENT_MAP))
        .containsKey("topChange");
  }

  @Test
  public void testCustomDirectEvents() {
    ViewManager mockViewManager = mock(ViewManager.class);
    List<ViewManager> viewManagers = Arrays.asList(mockViewManager);
    when(mockViewManager.getExportedCustomDirectEventTypeConstants())
        .thenReturn(MapBuilder.of("onTwirl", TWIRL_DIRECT_EVENT_MAP));
    UIManagerModule uiManagerModule =
        new UIManagerModule(mReactContext, viewManagers, mUIImplementationProvider, 0);
    Map<String, Object> constants = uiManagerModule.getConstants();
    assertThat((Map) constants.get(CUSTOM_DIRECT_EVENT_TYPES))
        .contains(MapEntry.entry("onTwirl", TWIRL_DIRECT_EVENT_MAP))
        .containsKey("topLoadingStart");
  }

  @Test
  public void testCustomViewConstants() {
    ViewManager mockViewManager = mock(ViewManager.class);
    List<ViewManager> viewManagers = Arrays.asList(mockViewManager);
    when(mockViewManager.getName()).thenReturn("RedPandaPhotoOfTheDayView");
    when(mockViewManager.getExportedViewConstants())
        .thenReturn(MapBuilder.of("PhotoSizeType", MapBuilder.of("Small", 1, "Large", 2)));
    UIManagerModule uiManagerModule =
        new UIManagerModule(mReactContext, viewManagers, mUIImplementationProvider, 0);
    Map<String, Object> constants = uiManagerModule.getConstants();
    assertThat(constants).containsKey("RedPandaPhotoOfTheDayView");
    assertThat((Map) constants.get("RedPandaPhotoOfTheDayView")).containsKey("Constants");
    assertThat((Map) valueAtPath(constants, "RedPandaPhotoOfTheDayView", "Constants"))
        .containsKey("PhotoSizeType");
  }

  @Test
  public void testNativeProps() {
    ViewManager mockViewManager = mock(ViewManager.class);
    List<ViewManager> viewManagers = Arrays.asList(mockViewManager);
    when(mockViewManager.getName()).thenReturn("SomeView");
    when(mockViewManager.getNativeProps())
        .thenReturn(MapBuilder.of("fooProp", "number"));
    UIManagerModule uiManagerModule =
        new UIManagerModule(mReactContext, viewManagers, mUIImplementationProvider, 0);
    Map<String, Object> constants = uiManagerModule.getConstants();
    assertThat((String) valueAtPath(constants, "SomeView", "NativeProps", "fooProp"))
        .isEqualTo("number");
  }

  @Test
  public void testMergeConstants() {
    ViewManager managerX = mock(ViewManager.class);
    when(managerX.getExportedCustomDirectEventTypeConstants()).thenReturn(MapBuilder.of(
        "onTwirl",
        MapBuilder.of(
            "registrationName",
            "onTwirl",
            "keyToOverride",
            "valueX",
            "mapToMerge",
            MapBuilder.of("keyToOverride", "innerValueX", "anotherKey", "valueX"))));

    ViewManager managerY = mock(ViewManager.class);
    when(managerY.getExportedCustomDirectEventTypeConstants()).thenReturn(MapBuilder.of(
        "onTwirl",
        MapBuilder.of(
            "extraKey",
            "extraValue",
            "keyToOverride",
            "valueY",
            "mapToMerge",
            MapBuilder.of("keyToOverride", "innerValueY", "extraKey", "valueY"))));

    List<ViewManager> viewManagers = Arrays.asList(managerX, managerY);
    UIManagerModule uiManagerModule =
        new UIManagerModule(mReactContext, viewManagers, mUIImplementationProvider, 0);
    Map<String, Object> constants = uiManagerModule.getConstants();
    assertThat((Map) constants.get(CUSTOM_DIRECT_EVENT_TYPES)).containsKey("onTwirl");

    Map twirlMap = (Map) valueAtPath(constants, CUSTOM_DIRECT_EVENT_TYPES, "onTwirl");
    assertThat(twirlMap)
        .contains(MapEntry.entry("registrationName", "onTwirl"))
        .contains(MapEntry.entry("keyToOverride", "valueY"))
        .contains(MapEntry.entry("extraKey", "extraValue"))
        .containsKey("mapToMerge");

    Map mapToMerge = (Map) valueAtPath(twirlMap, "mapToMerge");
    assertThat(mapToMerge)
        .contains(MapEntry.entry("keyToOverride", "innerValueY"))
        .contains(MapEntry.entry("anotherKey", "valueX"))
        .contains(MapEntry.entry("extraKey", "valueY"));
  }

  private static Object valueAtPath(Map nestedMap, String... keyPath) {
    assertThat(keyPath).isNotEmpty();
    Object value = nestedMap;
    for (String key : keyPath) {
      assertThat(value).isInstanceOf(Map.class);
      nestedMap = (Map) value;
      assertThat(nestedMap).containsKey(key);
      value = nestedMap.get(key);
    }
    return value;
  }
}

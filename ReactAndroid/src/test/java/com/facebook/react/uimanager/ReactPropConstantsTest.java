/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import android.util.DisplayMetrics;
import android.view.View;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.fest.assertions.api.Assertions.fail;

/**
 * Verifies that prop constants are generated properly based on {@code ReactProp} annotation.
 */
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class ReactPropConstantsTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private class ViewManagerUnderTest extends ViewManager<View, ReactShadowNode> {

    @Override
    public String getName() {
      return "SomeView";
    }

    @Override
    public ReactShadowNode createShadowNodeInstance() {
      fail("This method should not be executed as a part of this test");
      return null;
    }

    @Override
    protected View createViewInstance(ThemedReactContext reactContext) {
      fail("This method should not be executed as a part of this test");
      return null;
    }

    @Override
    public Class<? extends ReactShadowNode> getShadowNodeClass() {
      return ReactShadowNode.class;
    }

    @Override
    public void updateExtraData(View root, Object extraData) {
      fail("This method should not be executed as a part of this test");
    }

    @ReactProp(name = "boolProp")
    public void setBoolProp(View v, boolean value) {
    }

    @ReactProp(name = "intProp")
    public void setIntProp(View v, int value) {
    }

    @ReactProp(name = "floatProp")
    public void setFloatProp(View v, float value) {
    }

    @ReactProp(name = "doubleProp")
    public void setDoubleProp(View v, double value) {
    }

    @ReactProp(name = "stringProp")
    public void setStringProp(View v, String value) {
    }

    @ReactProp(name = "boxedBoolProp")
    public void setBoxedBoolProp(View v, Boolean value) {
    }

    @ReactProp(name = "boxedIntProp")
    public void setBoxedIntProp(View v, Integer value) {
    }

    @ReactProp(name = "arrayProp")
    public void setArrayProp(View v, ReadableArray value) {
    }

    @ReactProp(name = "mapProp")
    public void setMapProp(View v, ReadableMap value) {
    }

    @ReactPropGroup(names = {
        "floatGroupPropFirst",
        "floatGroupPropSecond",
    })
    public void setFloatGroupProp(View v, int index, float value) {
    }

    @ReactPropGroup(names = {
        "intGroupPropFirst",
        "intGroupPropSecond"
    })
    public void setIntGroupProp(View v, int index, int value) {
    }

    @ReactPropGroup(names = {
        "boxedIntGroupPropFirst",
        "boxedIntGroupPropSecond",
    })
    public void setBoxedIntGroupProp(View v, int index, Integer value) {
    }

    @ReactProp(name = "customIntProp", customType = "date")
    public void customIntProp(View v, int value) {
    }

    @ReactPropGroup(names = {
        "customBoxedIntGroupPropFirst",
        "customBoxedIntGroupPropSecond"
    }, customType = "color")
    public void customIntGroupProp(View v, int index, Integer value) {
    }
  }

  @Test
  public void testNativePropsIncludeCorrectTypes() {
    List<ViewManager> viewManagers = Arrays.<ViewManager>asList(new ViewManagerUnderTest());
    ReactApplicationContext reactContext = new ReactApplicationContext(RuntimeEnvironment.application);
    DisplayMetrics displayMetrics = reactContext.getResources().getDisplayMetrics();
    DisplayMetricsHolder.setWindowDisplayMetrics(displayMetrics);
    DisplayMetricsHolder.setScreenDisplayMetrics(displayMetrics);
    UIManagerModule uiManagerModule = new UIManagerModule(
        reactContext,
        viewManagers,
        new UIImplementation(reactContext, viewManagers));
    Map<String, String> constants =
        (Map) valueAtPath(uiManagerModule.getConstants(), "SomeView", "NativeProps");
    assertThat(constants).isEqualTo(
        MapBuilder.<String, String>builder()
            .put("boolProp", "boolean")
            .put("intProp", "number")
            .put("doubleProp", "number")
            .put("floatProp", "number")
            .put("stringProp", "String")
            .put("boxedBoolProp", "boolean")
            .put("boxedIntProp", "number")
            .put("arrayProp", "Array")
            .put("mapProp", "Map")
            .put("floatGroupPropFirst", "number")
            .put("floatGroupPropSecond", "number")
            .put("intGroupPropFirst", "number")
            .put("intGroupPropSecond", "number")
            .put("boxedIntGroupPropFirst", "number")
            .put("boxedIntGroupPropSecond", "number")
            .put("customIntProp", "date")
            .put("customBoxedIntGroupPropFirst", "color")
            .put("customBoxedIntGroupPropSecond", "color")
            .build());
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

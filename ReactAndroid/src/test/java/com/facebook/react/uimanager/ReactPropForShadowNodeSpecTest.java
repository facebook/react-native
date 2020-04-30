/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.View;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import java.util.Map;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

/**
 * Test that verifies that spec of methods annotated with @ReactProp in {@link ReactShadowNode} is
 * correct
 */
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class ReactPropForShadowNodeSpecTest {

  @Rule public PowerMockRule rule = new PowerMockRule();

  private static class BaseViewManager extends ViewManager {

    private final Class<? extends ReactShadowNode> mShadowNodeClass;

    private BaseViewManager(Class<? extends ReactShadowNode> shadowNodeClass) {
      mShadowNodeClass = shadowNodeClass;
    }

    @Override
    public String getName() {
      return "IgnoredName";
    }

    @Override
    public ReactShadowNode createShadowNodeInstance() {
      return null;
    }

    @Override
    public Class getShadowNodeClass() {
      return mShadowNodeClass;
    }

    @Override
    protected View createViewInstance(ThemedReactContext reactContext) {
      return null;
    }

    @Override
    public void updateExtraData(View root, Object extraData) {}
  }

  @Test(expected = RuntimeException.class)
  public void testMethodWithWrongNumberOfParams() {
    new BaseViewManager(
            new ReactShadowNodeImpl() {
              @ReactProp(name = "prop")
              public void setterWithIncorrectNumberOfArgs(boolean value, int anotherValue) {}
            }.getClass())
        .getNativeProps();
  }

  @Test(expected = RuntimeException.class)
  public void testMethodWithTooFewParams() {
    new BaseViewManager(
            new ReactShadowNodeImpl() {
              @ReactProp(name = "prop")
              public void setterWithNoArgs() {}
            }.getClass())
        .getNativeProps();
  }

  @Test(expected = RuntimeException.class)
  public void testUnsupportedValueType() {
    new BaseViewManager(
            new ReactShadowNodeImpl() {
              @ReactProp(name = "prop")
              public void setterWithMap(Map value) {}
            }.getClass())
        .getNativeProps();
  }

  @Test(expected = RuntimeException.class)
  public void testGroupInvalidNumberOfParams() {
    new BaseViewManager(
            new ReactShadowNodeImpl() {
              @ReactPropGroup(names = {"prop1", "prop2"})
              public void setterWithTooManyParams(int index, float value, boolean bool) {}
            }.getClass())
        .getNativeProps();
  }

  @Test(expected = RuntimeException.class)
  public void testGroupTooFewParams() {
    new BaseViewManager(
            new ReactShadowNodeImpl() {
              @ReactPropGroup(names = {"prop1", "prop2"})
              public void setterWithTooManyParams(int index) {}
            }.getClass())
        .getNativeProps();
  }

  @Test(expected = RuntimeException.class)
  public void testGroupNoIndexParam() {
    new BaseViewManager(
            new ReactShadowNodeImpl() {
              @ReactPropGroup(names = {"prop1", "prop2"})
              public void setterWithTooManyParams(float value, boolean bool) {}
            }.getClass())
        .getNativeProps();
  }
}

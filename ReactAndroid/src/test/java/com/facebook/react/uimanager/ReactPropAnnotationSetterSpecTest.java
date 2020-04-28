/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.uimanager;

import android.view.View;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import java.util.Date;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

/** Test that verifies that spec of methods annotated with @ReactProp is correct */
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class ReactPropAnnotationSetterSpecTest {

  @Rule public PowerMockRule rule = new PowerMockRule();

  private abstract class BaseViewManager extends ViewManager<View, ReactShadowNode> {

    @Override
    public String getName() {
      return "IgnoredName";
    }

    @Override
    public ReactShadowNode createShadowNodeInstance() {
      return null;
    }

    @Override
    public Class<? extends ReactShadowNode> getShadowNodeClass() {
      return ReactShadowNode.class;
    }

    @Override
    protected View createViewInstance(ThemedReactContext reactContext) {
      return null;
    }

    @Override
    public void updateExtraData(View root, Object extraData) {}
  }

  @Test(expected = RuntimeException.class)
  public void testMethodWithWongNumberOfParams() {
    new BaseViewManager() {
      @ReactProp(name = "prop")
      public void setterWithIncorrectNumberOfArgs(View v, boolean value, boolean otherValue) {}
    }.getNativeProps();
  }

  @Test(expected = RuntimeException.class)
  public void testMethodWithTooFewParams() {
    new BaseViewManager() {
      @ReactProp(name = "prop")
      public void setterWithTooFewParams(View v) {}
    }.getNativeProps();
  }

  @Test(expected = RuntimeException.class)
  public void testUnsupportedPropValueType() {
    new BaseViewManager() {
      @ReactProp(name = "prop")
      public void setterWithUnsupportedValueType(View v, Date value) {}
    }.getNativeProps();
  }

  @Test(expected = RuntimeException.class)
  public void testSetterWIthNonViewParam() {
    new BaseViewManager() {
      @ReactProp(name = "prop")
      public void setterWithNonViewParam(Object v, boolean value) {}
    }.getNativeProps();
  }

  @Test(expected = RuntimeException.class)
  public void testGroupInvalidNumberOfParams() {
    new BaseViewManager() {
      @ReactPropGroup(names = {"prop1", "prop2"})
      public void setterWIthInvalidNumberOfParams(View v, int index, float value, float other) {}
    }.getNativeProps();
  }

  @Test(expected = RuntimeException.class)
  public void testGroupTooFewParams() {
    new BaseViewManager() {
      @ReactPropGroup(names = {"prop1", "prop2"})
      public void setterWIthTooFewParams(View v, int index) {}
    }.getNativeProps();
  }

  @Test(expected = RuntimeException.class)
  public void testGroupNoIndexParam() {
    new BaseViewManager() {
      @ReactPropGroup(names = {"prop1", "prop2"})
      public void setterWithoutIndexParam(View v, float value, float sth) {}
    }.getNativeProps();
  }

  @Test(expected = RuntimeException.class)
  public void testGroupNoViewParam() {
    new BaseViewManager() {
      @ReactPropGroup(names = {"prop1", "prop2"})
      public void setterWithoutViewParam(Object v, int index, float value) {}
    }.getNativeProps();
  }

  @Test(expected = RuntimeException.class)
  public void testGroupUnsupportedPropType() {
    new BaseViewManager() {
      @ReactPropGroup(names = {"prop1", "prop2"})
      public void setterWithUnsupportedPropType(View v, int index, long value) {}
    }.getNativeProps();
  }
}

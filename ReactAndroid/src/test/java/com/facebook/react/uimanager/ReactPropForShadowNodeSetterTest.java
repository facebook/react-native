/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import javax.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;

import org.junit.Before;
import org.junit.runner.RunWith;
import org.junit.Rule;
import org.junit.Test;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

/**
 * Test {@link ReactProp} annotation for {@link ReactShadowNode}. More comprahensive test of this
 * annotation can be found in {@link ReactPropAnnotationSetterTest} where we test all possible types
 * of properties to be updated.
 */
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class ReactPropForShadowNodeSetterTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  public interface ViewManagerUpdatesReceiver {
    void onBooleanSetterCalled(boolean value);
    void onIntSetterCalled(int value);
    void onDoubleSetterCalled(double value);
    void onFloatSetterCalled(float value);
    void onStringSetterCalled(String value);
    void onBoxedBooleanSetterCalled(Boolean value);
    void onBoxedIntSetterCalled(Integer value);
    void onArraySetterCalled(ReadableArray value);
    void onMapSetterCalled(ReadableMap value);
    void onFloatGroupPropSetterCalled(int index, float value);
    void onIntGroupPropSetterCalled(int index, int value);
    void onBoxedIntGroupPropSetterCalled(int index, Integer value);
  }

  public static ReactStylesDiffMap buildStyles(Object... keysAndValues) {
    return new ReactStylesDiffMap(JavaOnlyMap.of(keysAndValues));
  }

  private class ShadowViewUnderTest extends ReactShadowNode {

    private ViewManagerUpdatesReceiver mViewManagerUpdatesReceiver;

    private ShadowViewUnderTest(ViewManagerUpdatesReceiver viewManagerUpdatesReceiver) {
      mViewManagerUpdatesReceiver = viewManagerUpdatesReceiver;
    }

    @ReactProp(name = "boolProp")
    public void setBoolProp(boolean value) {
      mViewManagerUpdatesReceiver.onBooleanSetterCalled(value);
    }

    @ReactProp(name = "stringProp")
    public void setStringProp(@Nullable String value) {
      mViewManagerUpdatesReceiver.onStringSetterCalled(value);
    }

    @ReactProp(name = "boxedIntProp")
    public void setBoxedIntProp(@Nullable Integer value) {
      mViewManagerUpdatesReceiver.onBoxedIntSetterCalled(value);
    }

    @ReactPropGroup(names = {
      "floatGroupPropFirst",
      "floatGroupPropSecond",
    })
    public void setFloatGroupProp(int index, float value) {
      mViewManagerUpdatesReceiver.onFloatGroupPropSetterCalled(index, value);
    }
  }

  private ViewManagerUpdatesReceiver mUpdatesReceiverMock;
  private ShadowViewUnderTest mShadowView;

  @Before
  public void setup() {
    mUpdatesReceiverMock = mock(ViewManagerUpdatesReceiver.class);
    mShadowView = new ShadowViewUnderTest(mUpdatesReceiverMock);
  }

  @Test
  public void testBooleanSetter() {
    mShadowView.updateProperties(buildStyles("boolProp", true));
    verify(mUpdatesReceiverMock).onBooleanSetterCalled(true);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mShadowView.updateProperties(buildStyles("boolProp", false));
    verify(mUpdatesReceiverMock).onBooleanSetterCalled(false);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mShadowView.updateProperties(buildStyles("boolProp", null));
    verify(mUpdatesReceiverMock).onBooleanSetterCalled(false);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test
  public void testStringSetter() {
    mShadowView.updateProperties(buildStyles("stringProp", "someRandomString"));
    verify(mUpdatesReceiverMock).onStringSetterCalled("someRandomString");
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mShadowView.updateProperties(buildStyles("stringProp", null));
    verify(mUpdatesReceiverMock).onStringSetterCalled(null);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test
  public void testFloatGroupSetter() {
    mShadowView.updateProperties(buildStyles("floatGroupPropFirst", 11.0));
    verify(mUpdatesReceiverMock).onFloatGroupPropSetterCalled(0, 11.0f);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mShadowView.updateProperties(buildStyles("floatGroupPropSecond", -111.0));
    verify(mUpdatesReceiverMock).onFloatGroupPropSetterCalled(1, -111.0f);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mShadowView.updateProperties(buildStyles("floatGroupPropSecond", null));
    verify(mUpdatesReceiverMock).onFloatGroupPropSetterCalled(1, 0.0f);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }
}

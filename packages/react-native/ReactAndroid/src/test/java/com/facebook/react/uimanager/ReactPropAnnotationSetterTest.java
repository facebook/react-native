/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static org.assertj.core.api.Assertions.fail;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import android.view.View;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

/**
 * Test updating view through {@link ViewManager} with {@link ReactProp} and {@link ReactPropGroup}
 * annotations.
 */
@RunWith(RobolectricTestRunner.class)
public class ReactPropAnnotationSetterTest {

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

  private class ViewManagerUnderTest extends ViewManager<View, ReactShadowNode> {

    final ViewManagerUpdatesReceiver mViewManagerUpdatesReceiver;

    private ViewManagerUnderTest(ViewManagerUpdatesReceiver viewManagerUpdatesReceiver) {
      mViewManagerUpdatesReceiver = viewManagerUpdatesReceiver;
    }

    @Override
    public String getName() {
      return "RedpandasLivestreamVideoView";
    }

    @Override
    public ReactShadowNode createShadowNodeInstance() {
      fail("This method should not be executed as a part of this test");
      return null;
    }

    @Override
    public Class<? extends ReactShadowNode> getShadowNodeClass() {
      return ReactShadowNode.class;
    }

    @Override
    protected View createViewInstance(ThemedReactContext reactContext) {
      fail("This method should not be executed as a part of this test");
      return null;
    }

    @Override
    public void updateExtraData(View root, Object extraData) {
      fail("This method should not be executed as a part of this test");
    }

    @ReactProp(name = "boolProp")
    public void setBoolProp(View v, boolean value) {
      mViewManagerUpdatesReceiver.onBooleanSetterCalled(value);
    }

    @ReactProp(name = "boolPropWithDefault", defaultBoolean = true)
    public void setBoolPropWithDefault(View v, boolean value) {
      mViewManagerUpdatesReceiver.onBooleanSetterCalled(value);
    }

    @ReactProp(name = "intProp")
    public void setIntProp(View v, int value) {
      mViewManagerUpdatesReceiver.onIntSetterCalled(value);
    }

    @ReactProp(name = "intPropWithDefault", defaultInt = 7168)
    public void setIntPropWithDefault(View v, int value) {
      mViewManagerUpdatesReceiver.onIntSetterCalled(value);
    }

    @ReactProp(name = "floatProp")
    public void setFloatProp(View v, float value) {
      mViewManagerUpdatesReceiver.onFloatSetterCalled(value);
    }

    @ReactProp(name = "floatPropWithDefault", defaultFloat = 14.0f)
    public void setFloatPropWithDefault(View v, float value) {
      mViewManagerUpdatesReceiver.onFloatSetterCalled(value);
    }

    @ReactProp(name = "doubleProp")
    public void setDoubleProp(View v, double value) {
      mViewManagerUpdatesReceiver.onDoubleSetterCalled(value);
    }

    @ReactProp(name = "doublePropWithDefault", defaultDouble = -88.0)
    public void setDoublePropWithDefault(View v, double value) {
      mViewManagerUpdatesReceiver.onDoubleSetterCalled(value);
    }

    @ReactProp(name = "stringProp")
    public void setStringProp(View v, String value) {
      mViewManagerUpdatesReceiver.onStringSetterCalled(value);
    }

    @ReactProp(name = "boxedBoolProp")
    public void setBoxedBoolProp(View v, Boolean value) {
      mViewManagerUpdatesReceiver.onBoxedBooleanSetterCalled(value);
    }

    @ReactProp(name = "boxedIntProp")
    public void setBoxedIntProp(View v, Integer value) {
      mViewManagerUpdatesReceiver.onBoxedIntSetterCalled(value);
    }

    @ReactProp(name = "arrayProp")
    public void setArrayProp(View v, ReadableArray value) {
      mViewManagerUpdatesReceiver.onArraySetterCalled(value);
    }

    @ReactProp(name = "mapProp")
    public void setMapProp(View v, ReadableMap value) {
      mViewManagerUpdatesReceiver.onMapSetterCalled(value);
    }

    @ReactPropGroup(
        names = {
          "floatGroupPropFirst",
          "floatGroupPropSecond",
        })
    public void setFloatGroupProp(View v, int index, float value) {
      mViewManagerUpdatesReceiver.onFloatGroupPropSetterCalled(index, value);
    }

    @ReactPropGroup(
        names = {
          "floatGroupPropWithDefaultFirst",
          "floatGroupPropWithDefaultSecond",
        },
        defaultFloat = -100.0f)
    public void setFloatGroupPropWithDefault(View v, int index, float value) {
      mViewManagerUpdatesReceiver.onFloatGroupPropSetterCalled(index, value);
    }

    @ReactPropGroup(names = {"intGroupPropFirst", "intGroupPropSecond"})
    public void setIntGroupProp(View v, int index, int value) {
      mViewManagerUpdatesReceiver.onIntGroupPropSetterCalled(index, value);
    }

    @ReactPropGroup(
        names = {"intGroupPropWithDefaultFirst", "intGroupPropWithDefaultSecond"},
        defaultInt = 555)
    public void setIntGroupPropWithDefault(View v, int index, int value) {
      mViewManagerUpdatesReceiver.onIntGroupPropSetterCalled(index, value);
    }

    @ReactPropGroup(
        names = {
          "boxedIntGroupPropFirst",
          "boxedIntGroupPropSecond",
        })
    public void setBoxedIntGroupProp(View v, int index, Integer value) {
      mViewManagerUpdatesReceiver.onBoxedIntGroupPropSetterCalled(index, value);
    }
  }

  public static ReactStylesDiffMap buildStyles(Object... keysAndValues) {
    return new ReactStylesDiffMap(JavaOnlyMap.of(keysAndValues));
  }

  private ViewManagerUnderTest mViewManager;
  private ViewManagerUpdatesReceiver mUpdatesReceiverMock;
  private View mTargetView;

  @Before
  public void setup() {
    mUpdatesReceiverMock = mock(ViewManagerUpdatesReceiver.class);
    mViewManager = new ViewManagerUnderTest(mUpdatesReceiverMock);
    mTargetView = new View(RuntimeEnvironment.getApplication());
  }

  @Test
  public void testBooleanSetter() {
    mViewManager.updateProperties(mTargetView, buildStyles("boolProp", true));
    verify(mUpdatesReceiverMock).onBooleanSetterCalled(true);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("boolProp", false));
    verify(mUpdatesReceiverMock).onBooleanSetterCalled(false);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("boolProp", null));
    verify(mUpdatesReceiverMock).onBooleanSetterCalled(false);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("boolPropWithDefault", false));
    verify(mUpdatesReceiverMock).onBooleanSetterCalled(false);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("boolPropWithDefault", null));
    verify(mUpdatesReceiverMock).onBooleanSetterCalled(true);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test
  public void testIntSetter() {
    mViewManager.updateProperties(mTargetView, buildStyles("intProp", 13));
    verify(mUpdatesReceiverMock).onIntSetterCalled(13);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("intProp", null));
    verify(mUpdatesReceiverMock).onIntSetterCalled(0);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("intPropWithDefault", -1));
    verify(mUpdatesReceiverMock).onIntSetterCalled(-1);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("intPropWithDefault", null));
    verify(mUpdatesReceiverMock).onIntSetterCalled(7168);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test
  public void testDoubleSetter() {
    mViewManager.updateProperties(mTargetView, buildStyles("doubleProp", 13.0));
    verify(mUpdatesReceiverMock).onDoubleSetterCalled(13.0);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("doubleProp", null));
    verify(mUpdatesReceiverMock).onDoubleSetterCalled(0.0);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("doublePropWithDefault", -1.0));
    verify(mUpdatesReceiverMock).onDoubleSetterCalled(-1.0);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("doublePropWithDefault", null));
    verify(mUpdatesReceiverMock).onDoubleSetterCalled(-88.0);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test
  public void testFloatSetter() {
    mViewManager.updateProperties(mTargetView, buildStyles("floatProp", 13.0));
    verify(mUpdatesReceiverMock).onFloatSetterCalled(13.0f);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("floatProp", null));
    verify(mUpdatesReceiverMock).onFloatSetterCalled(0.0f);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("floatPropWithDefault", -1.0));
    verify(mUpdatesReceiverMock).onFloatSetterCalled(-1.0f);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("floatPropWithDefault", null));
    verify(mUpdatesReceiverMock).onFloatSetterCalled(14.0f);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test
  public void testStringSetter() {
    mViewManager.updateProperties(mTargetView, buildStyles("stringProp", "someRandomString"));
    verify(mUpdatesReceiverMock).onStringSetterCalled("someRandomString");
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("stringProp", null));
    verify(mUpdatesReceiverMock).onStringSetterCalled(null);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test
  public void testBoxedBooleanSetter() {
    mViewManager.updateProperties(mTargetView, buildStyles("boxedBoolProp", true));
    verify(mUpdatesReceiverMock).onBoxedBooleanSetterCalled(Boolean.TRUE);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("boxedBoolProp", false));
    verify(mUpdatesReceiverMock).onBoxedBooleanSetterCalled(Boolean.FALSE);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("boxedBoolProp", null));
    verify(mUpdatesReceiverMock).onBoxedBooleanSetterCalled(null);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test
  public void testBoxedIntSetter() {
    mViewManager.updateProperties(mTargetView, buildStyles("boxedIntProp", 55));
    verify(mUpdatesReceiverMock).onBoxedIntSetterCalled(Integer.valueOf(55));
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("boxedIntProp", null));
    verify(mUpdatesReceiverMock).onBoxedIntSetterCalled(null);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test
  public void testArraySetter() {
    ReadableArray array = new JavaOnlyArray();
    mViewManager.updateProperties(mTargetView, buildStyles("arrayProp", array));
    verify(mUpdatesReceiverMock).onArraySetterCalled(array);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("arrayProp", null));
    verify(mUpdatesReceiverMock).onArraySetterCalled(null);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test
  public void testMapSetter() {
    ReadableMap map = new JavaOnlyMap();
    mViewManager.updateProperties(mTargetView, buildStyles("mapProp", map));
    verify(mUpdatesReceiverMock).onMapSetterCalled(map);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("mapProp", null));
    verify(mUpdatesReceiverMock).onMapSetterCalled(null);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test
  public void testFloatGroupSetter() {
    mViewManager.updateProperties(mTargetView, buildStyles("floatGroupPropFirst", 11.0));
    verify(mUpdatesReceiverMock).onFloatGroupPropSetterCalled(0, 11.0f);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("floatGroupPropSecond", -111.0));
    verify(mUpdatesReceiverMock).onFloatGroupPropSetterCalled(1, -111.0f);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("floatGroupPropSecond", null));
    verify(mUpdatesReceiverMock).onFloatGroupPropSetterCalled(1, 0.0f);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("floatGroupPropWithDefaultFirst", null));
    verify(mUpdatesReceiverMock).onFloatGroupPropSetterCalled(0, -100.0f);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test
  public void testIntGroupSetter() {
    mViewManager.updateProperties(mTargetView, buildStyles("intGroupPropFirst", -7));
    verify(mUpdatesReceiverMock).onIntGroupPropSetterCalled(0, -7);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("intGroupPropSecond", -77));
    verify(mUpdatesReceiverMock).onIntGroupPropSetterCalled(1, -77);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("intGroupPropSecond", null));
    verify(mUpdatesReceiverMock).onIntGroupPropSetterCalled(1, 0);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("intGroupPropWithDefaultFirst", 5));
    verify(mUpdatesReceiverMock).onIntGroupPropSetterCalled(0, 5);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("intGroupPropWithDefaultFirst", null));
    verify(mUpdatesReceiverMock).onIntGroupPropSetterCalled(0, 555);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("intGroupPropWithDefaultSecond", null));
    verify(mUpdatesReceiverMock).onIntGroupPropSetterCalled(1, 555);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test
  public void testStringGroupSetter() {
    mViewManager.updateProperties(mTargetView, buildStyles("boxedIntGroupPropFirst", -7));
    verify(mUpdatesReceiverMock).onBoxedIntGroupPropSetterCalled(0, -7);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("boxedIntGroupPropSecond", 12345));
    verify(mUpdatesReceiverMock).onBoxedIntGroupPropSetterCalled(1, 12345);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);

    mViewManager.updateProperties(mTargetView, buildStyles("boxedIntGroupPropSecond", null));
    verify(mUpdatesReceiverMock).onBoxedIntGroupPropSetterCalled(1, null);
    verifyNoMoreInteractions(mUpdatesReceiverMock);
    reset(mUpdatesReceiverMock);
  }

  @Test(expected = JSApplicationIllegalArgumentException.class)
  public void testFailToUpdateBoolPropWithMap() {
    mViewManager.updateProperties(mTargetView, buildStyles("boolProp", new JavaOnlyMap()));
  }

  @Test(expected = JSApplicationIllegalArgumentException.class)
  public void testFailToUpdateStringPropWithDouble() {
    mViewManager.updateProperties(mTargetView, buildStyles("stringProp", 14.5));
  }

  @Test(expected = JSApplicationIllegalArgumentException.class)
  public void testFailToUpdateDoublePropWithString() {
    mViewManager.updateProperties(mTargetView, buildStyles("doubleProp", "hello"));
  }

  @Test(expected = JSApplicationIllegalArgumentException.class)
  public void testFailToUpdateArrayPropWithBool() {
    mViewManager.updateProperties(mTargetView, buildStyles("arrayProp", false));
  }

  @Test(expected = JSApplicationIllegalArgumentException.class)
  public void testFailToUpdateMapPropWithArray() {
    mViewManager.updateProperties(mTargetView, buildStyles("mapProp", new JavaOnlyArray()));
  }
}

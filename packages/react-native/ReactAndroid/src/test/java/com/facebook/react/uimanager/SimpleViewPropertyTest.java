/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.offset;

import android.graphics.drawable.ColorDrawable;
import android.view.View;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.touch.JSResponderHandler;
import com.facebook.react.uimanager.annotations.ReactProp;
import java.util.Map;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

/** Verify {@link View} view property being applied properly by {@link SimpleViewManager} */
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class SimpleViewPropertyTest {

  @Rule public PowerMockRule rule = new PowerMockRule();

  private static int sViewTag = 2;

  private static class ConcreteViewManager extends SimpleViewManager<View> {

    @ReactProp(name = "foo")
    public void setFoo(View view, boolean foo) {}

    @ReactProp(name = "bar")
    public void setBar(View view, ReadableMap bar) {}

    @Override
    protected View createViewInstance(ThemedReactContext reactContext) {
      return new View(reactContext);
    }

    @Override
    public String getName() {
      return "View";
    }
  }

  private ReactApplicationContext mContext;
  private CatalystInstance mCatalystInstanceMock;
  private ThemedReactContext mThemedContext;
  private ConcreteViewManager mManager;

  @Before
  public void setup() {
    mContext = new ReactApplicationContext(RuntimeEnvironment.application);
    mCatalystInstanceMock = ReactTestHelper.createMockCatalystInstance();
    mContext.initializeWithInstance(mCatalystInstanceMock);
    mThemedContext = new ThemedReactContext(mContext, mContext);
    mManager = new ConcreteViewManager();
  }

  public ReactStylesDiffMap buildStyles(Object... keysAndValues) {
    return new ReactStylesDiffMap(JavaOnlyMap.of(keysAndValues));
  }

  @Test
  public void testOpacity() {
    View view =
        mManager.createView(
            sViewTag, mThemedContext, buildStyles(), null, new JSResponderHandler());

    mManager.updateProperties(view, buildStyles());
    assertThat(view.getAlpha()).isEqualTo(1.0f);

    mManager.updateProperties(view, buildStyles("opacity", 0.31));
    assertThat(view.getAlpha()).isEqualTo(0.31f, offset(1e-5f));

    mManager.updateProperties(view, buildStyles("opacity", null));
    assertThat(view.getAlpha()).isEqualTo(1.0f);
  }

  @Test
  public void testBackgroundColor() {
    View view =
        mManager.createView(
            sViewTag, mThemedContext, buildStyles(), null, new JSResponderHandler());

    mManager.updateProperties(view, buildStyles());
    assertThat(view.getBackground()).isEqualTo(null);

    mManager.updateProperties(view, buildStyles("backgroundColor", 12));
    assertThat(((ColorDrawable) view.getBackground()).getColor()).isEqualTo(12);

    mManager.updateProperties(view, buildStyles("backgroundColor", null));
    assertThat(((ColorDrawable) view.getBackground()).getColor()).isEqualTo(0);
  }

  @Test
  public void testGetNativeProps() {
    Map<String, String> nativeProps = mManager.getNativeProps();
    assertThat(nativeProps.get("foo")).isEqualTo("boolean");
    assertThat(nativeProps.get("bar")).isEqualTo("Map");
  }
}

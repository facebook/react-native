/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.slider;

import android.widget.SeekBar;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ThemedReactContext;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

import static org.fest.assertions.api.Assertions.assertThat;

/**
 * Verify {@link SeekBar} view property being applied properly by {@link ReactSliderManager}
 */
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class ReactSliderPropertyTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private ThemedReactContext mThemedContext;
  private ReactSliderManager mManager;

  @Before
  public void setup() {
    ReactApplicationContext mContext = new ReactApplicationContext(RuntimeEnvironment.application);
    CatalystInstance mCatalystInstanceMock = ReactTestHelper.createMockCatalystInstance();
    mContext.initializeWithInstance(mCatalystInstanceMock);
    mThemedContext = new ThemedReactContext(mContext, mContext);
    mManager = new ReactSliderManager();
  }

  public ReactStylesDiffMap buildStyles(Object... keysAndValues) {
    return new ReactStylesDiffMap(JavaOnlyMap.of(keysAndValues));
  }

  @Test
  public void testValueWithMaxValue() {
    ReactSlider view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles("maximumValue", 10.0));
    mManager.updateProperties(view, buildStyles("value", 5.5));
    assertThat(view.getProgress()).isEqualTo(70);
  }

  @Test
  public void testValueWithMaxValueSetBeforeMinValue() {
    ReactSlider view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles("maximumValue", 10.0));
    mManager.updateProperties(view, buildStyles("minimumValue", 5.0));
    mManager.updateProperties(view, buildStyles("value", 5.5));
    assertThat(view.getProgress()).isEqualTo(13);
  }

  @Test
  public void testValueWithMinValueSetBeforeMaxValue() {
    ReactSlider view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles("minimumValue", 5.0));
    mManager.updateProperties(view, buildStyles("maximumValue", 10.0));
    mManager.updateProperties(view, buildStyles("value", 5.5));
    assertThat(view.getProgress()).isEqualTo(13);
  }

  @Test
  public void testValueWithMaxValueAndStep() {
    ReactSlider view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles("maximumValue", 10.0));
    mManager.updateProperties(view, buildStyles("step", 3.0));
    mManager.updateProperties(view, buildStyles("value", 5.5));
    assertThat(view.getProgress()).isEqualTo(2);
  }

  @Test
  public void testValueWithMaxValueAndMinValueAndStep() {
    ReactSlider view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles("maximumValue", 10.0));
    mManager.updateProperties(view, buildStyles("minimumValue", 5.0));
    mManager.updateProperties(view, buildStyles("step", 3.0));
    mManager.updateProperties(view, buildStyles("value", 10.0));
    assertThat(view.getProgress()).isEqualTo(2);
  }
}

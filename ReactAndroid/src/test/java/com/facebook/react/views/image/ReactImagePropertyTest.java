/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image;

import android.graphics.Color;
import android.util.DisplayMetrics;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.soloader.SoLoader;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.Rule;
import org.junit.runner.RunWith;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.Robolectric;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

/**
 * Verify that {@link ScalingUtils} properties are being applied correctly
 * by {@link ReactImageManager}.
 */
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class ReactImagePropertyTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private ReactApplicationContext mContext;
  private CatalystInstance mCatalystInstanceMock;
  private ThemedReactContext mThemeContext;

  @Before
  public void setup() {
    SoLoader.setInTestMode();
    mContext = new ReactApplicationContext(RuntimeEnvironment.application);
    mCatalystInstanceMock = ReactTestHelper.createMockCatalystInstance();
    mContext.initializeWithInstance(mCatalystInstanceMock);
    mThemeContext = new ThemedReactContext(mContext, mContext);
    Fresco.initialize(mContext);
    DisplayMetricsHolder.setWindowDisplayMetrics(new DisplayMetrics());
  }

  @After
  public void teardown() {
    DisplayMetricsHolder.setWindowDisplayMetrics(null);
  }

  public ReactStylesDiffMap buildStyles(Object... keysAndValues) {
    return new ReactStylesDiffMap(JavaOnlyMap.of(keysAndValues));
  }

  @Test(expected=JSApplicationIllegalArgumentException.class)
  public void testImageInvalidResizeMode() {
    ReactImageManager viewManager = new ReactImageManager();
    ReactImageView view = viewManager.createViewInstance(mThemeContext);
    viewManager.updateProperties(view, buildStyles("resizeMode", "pancakes"));
  }

  @Test
  public void testBorderColor() {
    ReactImageManager viewManager = new ReactImageManager();
    ReactImageView view = viewManager.createViewInstance(mThemeContext);
    viewManager.updateProperties(
      view,
      buildStyles("src", JavaOnlyArray.of(JavaOnlyMap.of("uri", "http://mysite.com/mypic.jpg"))));

    viewManager.updateProperties(view, buildStyles("borderColor", Color.argb(0, 0, 255, 255)));
    int borderColor = view.getHierarchy().getRoundingParams().getBorderColor();
    assertEquals(0, Color.alpha(borderColor));
    assertEquals(0, Color.red(borderColor));
    assertEquals(255, Color.green(borderColor));
    assertEquals(255, Color.blue(borderColor));

    viewManager.updateProperties(view, buildStyles("borderColor", Color.argb(0, 255, 50, 128)));
    borderColor = view.getHierarchy().getRoundingParams().getBorderColor();
    assertEquals(0, Color.alpha(borderColor));
    assertEquals(255, Color.red(borderColor));
    assertEquals(50, Color.green(borderColor));
    assertEquals(128, Color.blue(borderColor));

    viewManager.updateProperties(view, buildStyles("borderColor", null));
    borderColor = view.getHierarchy().getRoundingParams().getBorderColor();
    assertEquals(0, Color.alpha(borderColor));
    assertEquals(0, Color.red(borderColor));
    assertEquals(0, Color.green(borderColor));
    assertEquals(0, Color.blue(borderColor));
  }

  @Test
  public void testRoundedCorners() {
    ReactImageManager viewManager = new ReactImageManager();
    ReactImageView view = viewManager.createViewInstance(mThemeContext);
    viewManager.updateProperties(
      view,
      buildStyles("src", JavaOnlyArray.of(JavaOnlyMap.of("uri", "http://mysite.com/mypic.jpg"))));

    // We can't easily verify if rounded corner was honored or not, this tests simply verifies
    // we're not crashing..
    viewManager.updateProperties(view, buildStyles("borderRadius", (double) 10));
    viewManager.updateProperties(view, buildStyles("borderRadius", (double) 0));
    viewManager.updateProperties(view, buildStyles("borderRadius", null));
  }

  @Test
  public void testTintColor() {
    ReactImageManager viewManager = new ReactImageManager();
    ReactImageView view = viewManager.createViewInstance(mThemeContext);
    assertNull(view.getColorFilter());
    viewManager.updateProperties(view, buildStyles("tintColor", Color.argb(50, 0, 0, 255)));
            // Can't actually assert the specific color so this is the next best thing.
            // Does the color filter now exist?
            assertNotNull(view.getColorFilter());
    viewManager.updateProperties(view, buildStyles("tintColor", null));
    assertNull(view.getColorFilter());
  }
}

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import android.graphics.Color;
import android.util.DisplayMetrics;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.util.RNLog;
import com.facebook.react.views.imagehelper.ImageSource;
import com.facebook.soloader.SoLoader;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

/**
 * Verify that {@link ScalingUtils} properties are being applied correctly by {@link
 * ReactImageManager}.
 */
@PrepareForTest({Arguments.class, RNLog.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class ReactImagePropertyTest {

  @Rule public PowerMockRule rule = new PowerMockRule();

  private ReactApplicationContext mContext;
  private CatalystInstance mCatalystInstanceMock;
  private ThemedReactContext mThemeContext;

  @Before
  public void setup() {
    PowerMockito.mockStatic(Arguments.class);
    PowerMockito.when(Arguments.createArray())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) {
                return new JavaOnlyArray();
              }
            });
    PowerMockito.when(Arguments.createMap())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) {
                return new JavaOnlyMap();
              }
            });

    // RNLog is stubbed out and the whole class need to be mocked
    PowerMockito.mockStatic(RNLog.class);
    PowerMockito.doNothing().when(RNLog.class);
    RNLog.w(null, "");

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
  public void testAccessibilityFocus() {
    ReactImageManager viewManager = new ReactImageManager();
    ReactImageView view = viewManager.createViewInstance(mThemeContext);
    viewManager.setAccessible(view, true);
    assertEquals(true, view.isFocusable());
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

  @Test
  public void testNullSrcs() {
    ReactImageManager viewManager = new ReactImageManager();
    ReactImageView view = viewManager.createViewInstance(mThemeContext);
    WritableArray sources = Arguments.createArray();
    WritableMap srcObj = Arguments.createMap();
    srcObj.putNull("uri");
    srcObj.putNull("width");
    srcObj.putNull("height");
    sources.pushMap(srcObj);
    viewManager.setSource(view, sources);
    view.maybeUpdateView();
    assertEquals(
        ImageSource.getTransparentBitmapImageSource(view.getContext()), view.getImageSource());
  }
}

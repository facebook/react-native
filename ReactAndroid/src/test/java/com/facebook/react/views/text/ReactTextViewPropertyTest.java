/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

import android.util.DisplayMetrics;
import android.view.Gravity;

import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.text.ReactTextView;

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
 * Verify {@link TextView} view property being applied properly by {@link ReactTextViewManager}
 */
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class ReactTextViewPropertyTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private ReactApplicationContext mContext;
  private CatalystInstance mCatalystInstanceMock;
  private ThemedReactContext mThemedContext;
  private ReactTextViewManager mManager;

  @Before
  public void setup() {
    mContext = new ReactApplicationContext(RuntimeEnvironment.application);
    mCatalystInstanceMock = ReactTestHelper.createMockCatalystInstance();
    mContext.initializeWithInstance(mCatalystInstanceMock);
    mThemedContext = new ThemedReactContext(mContext, mContext);
    mManager = new ReactTextViewManager();
    DisplayMetricsHolder.setWindowDisplayMetrics(new DisplayMetrics());
  }

  public ReactStylesDiffMap buildStyles(Object... keysAndValues) {
    return new ReactStylesDiffMap(JavaOnlyMap.of(keysAndValues));
  }

  @Test
  public void testTextAlign() {
    ReactTextView view = mManager.createViewInstance(mThemedContext);
    int defaultGravity = view.getGravity();

    int defaultHorizontalGravity = defaultGravity & Gravity.HORIZONTAL_GRAVITY_MASK;
    int defaultVerticalGravity = defaultGravity & Gravity.VERTICAL_GRAVITY_MASK;

    // Theme
    assertThat(view.getGravity()).isNotEqualTo(Gravity.NO_GRAVITY);

    // TextAlign
    mManager.updateProperties(view, buildStyles("textAlign", "left"));
    assertThat(view.getGravity() & Gravity.HORIZONTAL_GRAVITY_MASK).isEqualTo(Gravity.LEFT);
    mManager.updateProperties(view, buildStyles("textAlign", "right"));
    assertThat(view.getGravity() & Gravity.HORIZONTAL_GRAVITY_MASK).isEqualTo(Gravity.RIGHT);
    mManager.updateProperties(view, buildStyles("textAlign", "center"));
    assertThat(view.getGravity() & Gravity.HORIZONTAL_GRAVITY_MASK).isEqualTo(Gravity.CENTER_HORIZONTAL);
    mManager.updateProperties(view, buildStyles("textAlign", null));
    assertThat(view.getGravity() & Gravity.HORIZONTAL_GRAVITY_MASK).isEqualTo(defaultHorizontalGravity);

    // TextAlignVertical
    mManager.updateProperties(view, buildStyles("textAlignVertical", "top"));
    assertThat(view.getGravity() & Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(Gravity.TOP);
    mManager.updateProperties(view, buildStyles("textAlignVertical", "bottom"));
    assertThat(view.getGravity() & Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(Gravity.BOTTOM);
    mManager.updateProperties(view, buildStyles("textAlignVertical", "center"));
    assertThat(view.getGravity() & Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(Gravity.CENTER_VERTICAL);
    mManager.updateProperties(view, buildStyles("textAlignVertical", null));
    assertThat(view.getGravity() & Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(defaultVerticalGravity);

    // TextAlign + TextAlignVertical
    mManager.updateProperties(
      view,
      buildStyles("textAlign", "center", "textAlignVertical", "center"));
    assertThat(view.getGravity()).isEqualTo(Gravity.CENTER);
    mManager.updateProperties(
      view,
      buildStyles("textAlign", "right", "textAlignVertical", "bottom"));
    assertThat(view.getGravity()).isEqualTo(Gravity.RIGHT | Gravity.BOTTOM);
    mManager.updateProperties(
      view,
      buildStyles("textAlign", null, "textAlignVertical", null));
    assertThat(view.getGravity()).isEqualTo(defaultGravity);
  }
}

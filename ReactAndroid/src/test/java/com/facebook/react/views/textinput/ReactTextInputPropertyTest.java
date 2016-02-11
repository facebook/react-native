/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.textinput;

import android.content.res.ColorStateList;
import android.graphics.Color;
import android.text.InputType;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.widget.EditText;

import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.JSApplicationCausedNativeException;
import com.facebook.react.bridge.SimpleMap;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.views.text.DefaultStyleValuesUtil;
import com.facebook.react.uimanager.ThemedReactContext;

import org.junit.Before;
import org.junit.Test;
import org.junit.Rule;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.powermock.core.classloader.annotations.PowerMockIgnore;

import static org.fest.assertions.api.Assertions.assertThat;

/**
 * Verify {@link EditText} view property being applied properly by {@link ReactTextInputManager}
 */
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class ReactTextInputPropertyTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private ReactApplicationContext mContext;
  private CatalystInstance mCatalystInstanceMock;
  private ThemedReactContext mThemedContext;
  private ReactTextInputManager mManager;

  @Before
  public void setup() {
    mContext = new ReactApplicationContext(RuntimeEnvironment.application);
    mCatalystInstanceMock = ReactTestHelper.createMockCatalystInstance();
    mContext.initializeWithInstance(mCatalystInstanceMock);
    mThemedContext = new ThemedReactContext(mContext, mContext);
    mManager = new ReactTextInputManager();
    DisplayMetricsHolder.setWindowDisplayMetrics(new DisplayMetrics());
  }

  public ReactStylesDiffMap buildStyles(Object... keysAndValues) {
    return new ReactStylesDiffMap(SimpleMap.of(keysAndValues));
  }

  @Test
  public void testAutoCorrect() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles());
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero();

    mManager.updateProperties(view, buildStyles("autoCorrect", true));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isNotZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero();

    mManager.updateProperties(view, buildStyles("autoCorrect", false));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isNotZero();

    mManager.updateProperties(view, buildStyles("autoCorrect", null));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero();
  }

  @Test
  public void testAutoCapitalize() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles());
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero();

    mManager.updateProperties(
        view,
        buildStyles("autoCapitalize", InputType.TYPE_TEXT_FLAG_CAP_SENTENCES));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isNotZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero();

    mManager.updateProperties(
        view,
        buildStyles("autoCapitalize", InputType.TYPE_TEXT_FLAG_CAP_WORDS));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_WORDS).isNotZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero();

    mManager.updateProperties(
        view,
        buildStyles("autoCapitalize", InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isNotZero();

    mManager.updateProperties(
        view,
        buildStyles("autoCapitalize", InputType.TYPE_CLASS_TEXT));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero();
  }

  @Test
  public void testPlaceholder() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);
    mManager.updateProperties(view, buildStyles());
    assertThat(view.getHint()).isNull();

    mManager.updateProperties(view, buildStyles("placeholder", "sometext"));
    assertThat(view.getHint()).isEqualTo("sometext");

    mManager.updateProperties(view, buildStyles("placeholder", null));
    assertThat(view.getHint()).isNull();
  }

  @Test
  public void testEditable() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles());
    assertThat(view.isEnabled()).isTrue();

    mManager.updateProperties(view, buildStyles("editable", false));
    assertThat(view.isEnabled()).isFalse();

    mManager.updateProperties(view, buildStyles("editable", null));
    assertThat(view.isEnabled()).isTrue();

    mManager.updateProperties(view, buildStyles("editable", false));
    assertThat(view.isEnabled()).isFalse();

    mManager.updateProperties(view, buildStyles("editable", true));
    assertThat(view.isEnabled()).isTrue();
  }

  @Test
  public void testPlaceholderTextColor() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);

    final ColorStateList defaultPlaceholderColorStateList =
        DefaultStyleValuesUtil.getDefaultTextColorHint(
            view.getContext());

    ColorStateList colors = view.getHintTextColors();
    assertThat(colors).isEqualTo(defaultPlaceholderColorStateList);

    mManager.updateProperties(view, buildStyles("placeholderTextColor", null));
    colors = view.getHintTextColors();
    assertThat(colors).isEqualTo(defaultPlaceholderColorStateList);

    mManager.updateProperties(view, buildStyles("placeholderTextColor", Color.RED));
    colors = view.getHintTextColors();
    assertThat(colors.getDefaultColor()).isEqualTo(Color.RED);

    mManager.updateProperties(view, buildStyles("placeholderTextColor", null));
    colors = view.getHintTextColors();
    assertThat(colors).isEqualTo(defaultPlaceholderColorStateList);
  }

  @Test
  public void testMultiline() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles());
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero();

    mManager.updateProperties(view, buildStyles("multiline", false));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero();

    mManager.updateProperties(view, buildStyles("multiline", true));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_MULTI_LINE).isNotZero();

    mManager.updateProperties(view, buildStyles("multiline", null));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero();
  }

  @Test
  public void testNumLines() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles());
    assertThat(view.getMinLines()).isEqualTo(1);

    mManager.updateProperties(view, buildStyles("numberOfLines", 5));
    assertThat(view.getMinLines()).isEqualTo(5);

    mManager.updateProperties(view, buildStyles("numberOfLines", 4));
    assertThat(view.getMinLines()).isEqualTo(4);
  }

  @Test
  public void testKeyboardType() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles());
    assertThat(view.getInputType() & InputType.TYPE_CLASS_NUMBER).isZero();

    mManager.updateProperties(view, buildStyles("keyboardType", "text"));
    assertThat(view.getInputType() & InputType.TYPE_CLASS_NUMBER).isZero();

    mManager.updateProperties(view, buildStyles("keyboardType", "numeric"));
    assertThat(view.getInputType() & InputType.TYPE_CLASS_NUMBER).isNotZero();

    mManager.updateProperties(view, buildStyles("keyboardType", "email-address"));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS).isNotZero();

    mManager.updateProperties(view, buildStyles("keyboardType", null));
    assertThat(view.getInputType() & InputType.TYPE_CLASS_NUMBER).isZero();
  }

  @Test
  public void testPasswordInput() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles());
    assertThat(view.getInputType() & InputType.TYPE_TEXT_VARIATION_PASSWORD).isZero();

    mManager.updateProperties(view, buildStyles("password", false));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_VARIATION_PASSWORD).isZero();

    mManager.updateProperties(view, buildStyles("password", true));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_VARIATION_PASSWORD).isNotZero();

    mManager.updateProperties(view, buildStyles("password", null));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_VARIATION_PASSWORD).isZero();
  }

  @Test
  public void testIncrementalInputTypeUpdates() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles());
    assertThat(view.getInputType() & InputType.TYPE_CLASS_NUMBER).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero();

    mManager.updateProperties(view, buildStyles("multiline", true));
    assertThat(view.getInputType() & InputType.TYPE_CLASS_NUMBER).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_MULTI_LINE).isNotZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero();

    mManager.updateProperties(view, buildStyles("autoCorrect", false));
    assertThat(view.getInputType() & InputType.TYPE_CLASS_NUMBER).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_MULTI_LINE).isNotZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isNotZero();

    mManager.updateProperties(view, buildStyles("keyboardType", "NUMERIC"));
    assertThat(view.getInputType() & InputType.TYPE_CLASS_NUMBER).isNotZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_MULTI_LINE).isNotZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isNotZero();

    mManager.updateProperties(view, buildStyles("multiline", null));
    assertThat(view.getInputType() & InputType.TYPE_CLASS_NUMBER).isNotZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isNotZero();
  }

  @Test
  public void testTextAlign() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);
    int gravity = view.getGravity();
    assertThat(view.getGravity() & Gravity.BOTTOM).isNotEqualTo(Gravity.BOTTOM);

    mManager.updateProperties(view, buildStyles("textAlignVertical", "bottom"));
    assertThat(view.getGravity() & Gravity.BOTTOM).isEqualTo(Gravity.BOTTOM);

    mManager.updateProperties(
        view,
        buildStyles("textAlign", "right", "textAlignVertical", "top"));
    assertThat(view.getGravity() & Gravity.BOTTOM).isNotEqualTo(Gravity.BOTTOM);
    assertThat(view.getGravity() & (Gravity.RIGHT | Gravity.TOP))
        .isEqualTo(Gravity.RIGHT | Gravity.TOP);

    mManager.updateProperties(
        view,
        buildStyles("textAlignVertical", null));
    assertThat(view.getGravity() & Gravity.RIGHT).isEqualTo(Gravity.RIGHT);
    assertThat(view.getGravity() & Gravity.TOP).isNotEqualTo(Gravity.TOP);

    mManager.updateProperties(view, buildStyles("textAlign", null));
    assertThat(view.getGravity()).isEqualTo(gravity);
  }
}

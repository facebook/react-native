/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import static org.fest.assertions.api.Assertions.assertThat;

import android.content.res.ColorStateList;
import android.graphics.Color;
import android.os.Build;
import android.text.InputFilter;
import android.text.InputType;
import android.text.Layout;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.text.DefaultStyleValuesUtil;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

/** Verify {@link EditText} view property being applied properly by {@link ReactTextInputManager} */
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class ReactTextInputPropertyTest {

  @Rule public PowerMockRule rule = new PowerMockRule();

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
    return new ReactStylesDiffMap(JavaOnlyMap.of(keysAndValues));
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
        view, buildStyles("autoCapitalize", InputType.TYPE_TEXT_FLAG_CAP_SENTENCES));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isNotZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero();

    mManager.updateProperties(
        view, buildStyles("autoCapitalize", InputType.TYPE_TEXT_FLAG_CAP_WORDS));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_WORDS).isNotZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero();

    mManager.updateProperties(
        view, buildStyles("autoCapitalize", InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero();
    assertThat(view.getInputType() & InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isNotZero();

    mManager.updateProperties(view, buildStyles("autoCapitalize", InputType.TYPE_CLASS_TEXT));
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
        DefaultStyleValuesUtil.getDefaultTextColorHint(view.getContext());

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
  public void testBlurMultiline() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles("multiline", true));
    mManager.updateProperties(view, buildStyles("blurOnSubmit", true));

    EditorInfo editorInfo = new EditorInfo();
    editorInfo.imeOptions = EditorInfo.IME_ACTION_DONE | EditorInfo.IME_FLAG_NO_ENTER_ACTION;
    view.onCreateInputConnection(editorInfo);

    assertThat(editorInfo.imeOptions).isEqualTo(EditorInfo.IME_ACTION_DONE);
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
    int numberPadTypeFlags = InputType.TYPE_CLASS_NUMBER;
    int urlTypeFlags = InputType.TYPE_TEXT_VARIATION_URI;
    int decimalPadTypeFlags = InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL;
    int numericTypeFlags =
        InputType.TYPE_CLASS_NUMBER
            | InputType.TYPE_NUMBER_FLAG_DECIMAL
            | InputType.TYPE_NUMBER_FLAG_SIGNED;
    int emailTypeFlags = InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS | InputType.TYPE_CLASS_TEXT;
    int passwordVisibilityFlag =
        InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD & ~InputType.TYPE_TEXT_VARIATION_PASSWORD;

    int generalKeyboardTypeFlags =
        numericTypeFlags
            | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
            | InputType.TYPE_CLASS_TEXT
            | InputType.TYPE_CLASS_PHONE
            | passwordVisibilityFlag;

    mManager.updateProperties(view, buildStyles());
    assertThat(view.getInputType() & generalKeyboardTypeFlags).isEqualTo(InputType.TYPE_CLASS_TEXT);

    mManager.updateProperties(view, buildStyles("keyboardType", "text"));
    assertThat(view.getInputType() & generalKeyboardTypeFlags).isEqualTo(InputType.TYPE_CLASS_TEXT);

    mManager.updateProperties(view, buildStyles("keyboardType", "number-pad"));
    assertThat(view.getInputType() & generalKeyboardTypeFlags).isEqualTo(numberPadTypeFlags);

    mManager.updateProperties(view, buildStyles("keyboardType", "url"));
    assertThat(view.getInputType() & generalKeyboardTypeFlags).isEqualTo(urlTypeFlags);

    mManager.updateProperties(view, buildStyles("keyboardType", "decimal-pad"));
    assertThat(view.getInputType() & generalKeyboardTypeFlags).isEqualTo(decimalPadTypeFlags);

    mManager.updateProperties(view, buildStyles("keyboardType", "numeric"));
    assertThat(view.getInputType() & generalKeyboardTypeFlags).isEqualTo(numericTypeFlags);

    mManager.updateProperties(view, buildStyles("keyboardType", "email-address"));
    assertThat(view.getInputType() & generalKeyboardTypeFlags).isEqualTo(emailTypeFlags);

    mManager.updateProperties(view, buildStyles("keyboardType", "phone-pad"));
    assertThat(view.getInputType() & generalKeyboardTypeFlags)
        .isEqualTo(InputType.TYPE_CLASS_PHONE);

    mManager.updateProperties(view, buildStyles("keyboardType", "visible-password"));
    assertThat(view.getInputType() & generalKeyboardTypeFlags).isEqualTo(passwordVisibilityFlag);

    mManager.updateProperties(view, buildStyles("keyboardType", null));
    assertThat(view.getInputType() & generalKeyboardTypeFlags).isEqualTo(InputType.TYPE_CLASS_TEXT);
  }

  @Test
  public void testPasswordInput() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);

    mManager.updateProperties(view, buildStyles());
    assertThat(view.getInputType() & InputType.TYPE_TEXT_VARIATION_PASSWORD).isZero();

    mManager.updateProperties(view, buildStyles("secureTextEntry", false));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_VARIATION_PASSWORD).isZero();

    mManager.updateProperties(view, buildStyles("secureTextEntry", true));
    assertThat(view.getInputType() & InputType.TYPE_TEXT_VARIATION_PASSWORD).isNotZero();

    mManager.updateProperties(view, buildStyles("secureTextEntry", null));
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
    assertThat(view.getGravity() & Gravity.HORIZONTAL_GRAVITY_MASK)
        .isEqualTo(Gravity.CENTER_HORIZONTAL);
    mManager.updateProperties(view, buildStyles("textAlign", null));
    assertThat(view.getGravity() & Gravity.HORIZONTAL_GRAVITY_MASK)
        .isEqualTo(defaultHorizontalGravity);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      mManager.updateProperties(view, buildStyles("textAlign", "justify"));
      assertThat(view.getJustificationMode()).isEqualTo(Layout.JUSTIFICATION_MODE_INTER_WORD);
    }

    // TextAlignVertical
    mManager.updateProperties(view, buildStyles("textAlignVertical", "top"));
    assertThat(view.getGravity() & Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(Gravity.TOP);
    mManager.updateProperties(view, buildStyles("textAlignVertical", "bottom"));
    assertThat(view.getGravity() & Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(Gravity.BOTTOM);
    mManager.updateProperties(view, buildStyles("textAlignVertical", "center"));
    assertThat(view.getGravity() & Gravity.VERTICAL_GRAVITY_MASK)
        .isEqualTo(Gravity.CENTER_VERTICAL);
    mManager.updateProperties(view, buildStyles("textAlignVertical", null));
    assertThat(view.getGravity() & Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(defaultVerticalGravity);

    // TextAlign + TextAlignVertical
    mManager.updateProperties(
        view, buildStyles("textAlign", "center", "textAlignVertical", "center"));
    assertThat(view.getGravity()).isEqualTo(Gravity.CENTER);
    mManager.updateProperties(
        view, buildStyles("textAlign", "right", "textAlignVertical", "bottom"));
    assertThat(view.getGravity()).isEqualTo(Gravity.RIGHT | Gravity.BOTTOM);
    mManager.updateProperties(view, buildStyles("textAlign", null, "textAlignVertical", null));
    assertThat(view.getGravity()).isEqualTo(defaultGravity);
  }

  @Test
  public void testMaxLength() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);
    InputFilter[] filters = new InputFilter[] {new InputFilter.AllCaps()};
    view.setFilters(filters);
    mManager.setMaxLength(view, null);
    assertThat(view.getFilters()).isEqualTo(filters);
  }

  @Test
  public void testSelection() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);
    view.setText("Need some text to select something...");

    mManager.updateProperties(view, buildStyles());
    assertThat(view.getSelectionStart()).isEqualTo(0);
    assertThat(view.getSelectionEnd()).isEqualTo(0);

    JavaOnlyMap selection = JavaOnlyMap.of("start", 5, "end", 10);
    mManager.updateProperties(view, buildStyles("selection", selection));
    assertThat(view.getSelectionStart()).isEqualTo(5);
    assertThat(view.getSelectionEnd()).isEqualTo(10);

    mManager.updateProperties(view, buildStyles("selection", null));
    assertThat(view.getSelectionStart()).isEqualTo(5);
    assertThat(view.getSelectionEnd()).isEqualTo(10);
  }
}

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import static com.facebook.react.views.textinput.AutoCompleteType.NAME_FULL;
import static org.fest.assertions.api.Assertions.assertThat;

import android.content.res.ColorStateList;
import android.graphics.Color;
import android.os.Build;
import android.text.InputFilter;
import android.text.InputType;
import android.text.Layout;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;

import androidx.autofill.HintConstants;

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
@PowerMockIgnore({"org.powermock.*", "org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
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

  @Test
  public void testAutoCompleteType() {
    ReactEditText view = mManager.createViewInstance(mThemedContext);

    // no hints

    mManager.updateProperties(view, buildStyles());
    assertThat(view.getAutofillHints()).isNull();

    mManager.updateProperties(view, buildStyles("autoCompleteType", "off"));
    assertThat(view.getAutofillHints()).isNull();
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_NO);

    mManager.updateProperties(view, buildStyles("autoCompleteType", null));
    assertThat(view.getAutofillHints()).isNull();
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_AUTO);

    // hints

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NAME_FULL.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PERSON_NAME);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NAME_HONORIFIC_PREFIX.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PERSON_NAME_PREFIX);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NAME_GIVEN.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PERSON_NAME_GIVEN);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NAME_ADDITIONAL.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PERSON_NAME_MIDDLE);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);


    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NAME_FAMILY.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PERSON_NAME_FAMILY);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);


    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NAME_HONORIFIC_SUFFIX.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PERSON_NAME_SUFFIX);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);


    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.USERNAME.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_USERNAME);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);


    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.PASSWORD_NEW.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_NEW_PASSWORD);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);


    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.PASSWORD_CURRENT.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PASSWORD);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.ADDRESS_FULL.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.ADDRESS_LINE_1.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_STREET_ADDRESS);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.ADDRESS_LOCALITY.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_LOCALITY);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.ADDRESS_REGION.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_REGION);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.ADDRESS_COUNTRY.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_COUNTRY);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.ADDRESS_POSTAL_CODE.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_POSTAL_CODE);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.CREDIT_CARD_NAME_FULL.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PERSON_NAME);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.CREDIT_CARD_NAME_GIVEN.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PERSON_NAME_GIVEN);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.CREDIT_CARD_NAME_ADDITIONAL.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PERSON_NAME_MIDDLE);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.CREDIT_CARD_NAME_FAMILY.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PERSON_NAME_FAMILY);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.CREDIT_CARD_NUMBER.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_CREDIT_CARD_NUMBER);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.CREDIT_CARD_EXPIRATION_DATE.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DATE);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.CREDIT_CARD_EXPIRATION_MONTH.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_MONTH);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.CREDIT_CARD_EXPIRATION_YEAR.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_YEAR);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.CREDIT_CARD_SECURITY_CODE.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.BIRTH_DATE_FULL.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_BIRTH_DATE_FULL);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.BIRTH_DATE_DAY.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_BIRTH_DATE_DAY);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.BIRTH_DATE_MONTH.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_BIRTH_DATE_MONTH);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.BIRTH_DATE_YEAR.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_BIRTH_DATE_YEAR);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.GENDER.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_GENDER);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.TELELPHONE_NUMBER.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PHONE_NUMBER);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.TELELPHONE_NUMBER_COUNTRY_CODE.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PHONE_COUNTRY_CODE);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.TELELPHONE_NUMBER_NATIONAL.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PHONE_NATIONAL);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.EMAIL.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_EMAIL_ADDRESS);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_OTP.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_SMS_OTP);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_OTP_CHAR_1.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.generateSmsOtpHintForCharacterPosition(1));
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_OTP_CHAR_2.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.generateSmsOtpHintForCharacterPosition(2));
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_OTP_CHAR_3.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.generateSmsOtpHintForCharacterPosition(3));
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_OTP_CHAR_4.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.generateSmsOtpHintForCharacterPosition(4));
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_OTP_CHAR_5.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.generateSmsOtpHintForCharacterPosition(5));
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_OTP_CHAR_6.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.generateSmsOtpHintForCharacterPosition(6));
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_OTP_CHAR_7.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.generateSmsOtpHintForCharacterPosition(7));
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_OTP_CHAR_8.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.generateSmsOtpHintForCharacterPosition(8));
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_TELEPHONE_NUMBER_DEVICE.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PHONE_NUMBER_DEVICE);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_CREDIT_CARD_EXPIRATION_DAY.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DAY);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_ADDRESS_EXTENDED_ADDRESS.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_EXTENDED_ADDRESS);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_ADDRESS_EXTENDED_POSTAL_CODE.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_EXTENDED_POSTAL_CODE);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_NAME_ADDITIONAL_INITIAL.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PERSON_NAME_MIDDLE_INITIAL);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_USERNAME_NEW.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_NEW_USERNAME);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);

    mManager.updateProperties(view, buildStyles("autoCompleteType", AutoCompleteType.NON_W3C_PASSWORD.toString()));
    assertThat(view.getAutofillHints()).containsExactly(HintConstants.AUTOFILL_HINT_PASSWORD);
    assertThat(view.getImportantForAutofill()).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES);
  }
}

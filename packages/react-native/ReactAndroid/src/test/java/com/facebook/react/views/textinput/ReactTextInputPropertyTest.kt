/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.graphics.Color
import android.os.Build
import android.text.InputFilter
import android.text.InputFilter.AllCaps
import android.text.InputType
import android.text.Layout
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.inputmethod.EditorInfo
import androidx.core.content.res.ResourcesCompat.ID_NULL
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.text.DefaultStyleValuesUtil.getDefaultTextColorHint
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.powermock.core.classloader.annotations.PowerMockIgnore
import org.powermock.modules.junit4.rule.PowerMockRule
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Verify {@link EditText} view property being applied properly by {@link ReactTextInputManager} */

@RunWith(RobolectricTestRunner::class)
@PowerMockIgnore("org.mockito.*", "org.robolectric.*", "androidx.*", "android.*")
class ReactTextInputPropertyTest {

  @get:Rule
  val rule = PowerMockRule()

  private lateinit var mContext: ReactApplicationContext
  private lateinit var mCatalystInstanceMock: CatalystInstance
  private lateinit var mThemedContext: ThemedReactContext
  private lateinit var mManager: ReactTextInputManager
  private lateinit var view: ReactEditText

  private val generalKeyboardTypeFlags: Int = (InputType.TYPE_CLASS_NUMBER
    or InputType.TYPE_NUMBER_FLAG_DECIMAL
    or InputType.TYPE_NUMBER_FLAG_SIGNED
    or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
    or InputType.TYPE_CLASS_TEXT
    or InputType.TYPE_CLASS_PHONE
    or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
    and InputType.TYPE_TEXT_VARIATION_PASSWORD.inv())

  @Before
  fun setup() {
    mContext = ReactApplicationContext(RuntimeEnvironment.getApplication())
    mCatalystInstanceMock = createMockCatalystInstance()
    mContext.initializeWithInstance(mCatalystInstanceMock)
    mThemedContext = ThemedReactContext(mContext, mContext, null, ID_NULL)
    mManager = ReactTextInputManager()
    DisplayMetricsHolder.setWindowDisplayMetrics(DisplayMetrics())
    view = mManager.createViewInstance(mThemedContext)
  }

  @Test
  fun testAutoCorrect() {
    mManager.updateProperties(view, buildStyles())
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero

    mManager.updateProperties(view, buildStyles("autoCorrect", true))
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero

    mManager.updateProperties(view, buildStyles("autoCorrect", false))
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isNotZero

    mManager.updateProperties(view, buildStyles("autoCorrect", null))
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero
  }

  @Test
  fun testAutoCapitalize() {
    mManager.updateProperties(view, buildStyles())
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero

    mManager.updateProperties(
      view,
      buildStyles("autoCapitalize", InputType.TYPE_TEXT_FLAG_CAP_SENTENCES)
    )
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero

    mManager.updateProperties(
      view,
      buildStyles("autoCapitalize", InputType.TYPE_TEXT_FLAG_CAP_WORDS)
    )
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_WORDS).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero

    mManager.updateProperties(
      view,
      buildStyles("autoCapitalize", InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS)
    )
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isNotZero

    mManager.updateProperties(
      view,
      buildStyles("autoCapitalize", InputType.TYPE_CLASS_TEXT)
    )
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero
  }

  @Test
  fun testPlaceholder() {
    mManager.updateProperties(view, buildStyles())
    assertThat(view.hint).isNull()

    mManager.updateProperties(view, buildStyles("placeholder", "sometext"))
    assertThat(view.hint).isEqualTo("sometext")

    mManager.updateProperties(view, buildStyles("placeholder", null))
    assertThat(view.hint).isNull()
  }

  @Test
  fun testEditable() {
    mManager.updateProperties(view, buildStyles())
    assertThat(view.isEnabled).isTrue

    mManager.updateProperties(view, buildStyles("editable", false))
    assertThat(view.isEnabled).isFalse

    mManager.updateProperties(view, buildStyles("editable", null))
    assertThat(view.isEnabled).isTrue

    mManager.updateProperties(view, buildStyles("editable", false))
    assertThat(view.isEnabled).isFalse

    mManager.updateProperties(view, buildStyles("editable", true))
    assertThat(view.isEnabled).isTrue
  }

  @Test
  fun testPlaceholderTextColor() {
    val defaultPlaceholderColorStateList = getDefaultTextColorHint(view.context)
    var colors = view.hintTextColors
    assertThat(colors).isEqualTo(defaultPlaceholderColorStateList)

    mManager.updateProperties(view, buildStyles("placeholderTextColor", null))
    colors = view.hintTextColors
    assertThat(colors).isEqualTo(defaultPlaceholderColorStateList)

    mManager.updateProperties(view, buildStyles("placeholderTextColor", Color.RED))
    colors = view.hintTextColors
    assertThat(colors.defaultColor).isEqualTo(Color.RED)

    mManager.updateProperties(view, buildStyles("placeholderTextColor", null))
    colors = view.hintTextColors
    assertThat(colors).isEqualTo(defaultPlaceholderColorStateList)
  }

  @Test
  fun testMultiline() {
    mManager.updateProperties(view, buildStyles())
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero

    mManager.updateProperties(view, buildStyles("multiline", false))
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero

    mManager.updateProperties(view, buildStyles("multiline", true))
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isNotZero

    mManager.updateProperties(view, buildStyles("multiline", null))
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero
  }

  @Test
  fun testBlurMultiline() {
    val editorInfo = EditorInfo().apply {
      imeOptions = EditorInfo.IME_ACTION_DONE or EditorInfo.IME_FLAG_NO_ENTER_ACTION
    }
    mManager.updateProperties(view, buildStyles("multiline", true))
    mManager.updateProperties(view, buildStyles("submitBehavior", "blurAndSubmit"))
    view.onCreateInputConnection(editorInfo)
    assertThat(editorInfo.imeOptions).isEqualTo(EditorInfo.IME_ACTION_DONE)
  }

  @Test
  fun testNumLines() {
    mManager.updateProperties(view, buildStyles())
    assertThat(view.minLines).isEqualTo(1)

    mManager.updateProperties(view, buildStyles("numberOfLines", 5))
    assertThat(view.minLines).isEqualTo(5)

    mManager.updateProperties(view, buildStyles("numberOfLines", 4))
    assertThat(view.minLines).isEqualTo(4)
  }

  @Test
  fun testKeyboardTypeClassText() {
    mManager.updateProperties(view, buildStyles("keyboardType", null))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(InputType.TYPE_CLASS_TEXT)

    mManager.updateProperties(view, buildStyles())
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(InputType.TYPE_CLASS_TEXT)

    mManager.updateProperties(view, buildStyles("keyboardType", "text"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(InputType.TYPE_CLASS_TEXT)
  }

  @Test
  fun testKeyboardTypePad() {
    val numberPadTypeFlags = InputType.TYPE_CLASS_NUMBER
    val decimalPadTypeFlags = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL

    mManager.updateProperties(view, buildStyles("keyboardType", "phone-pad"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(InputType.TYPE_CLASS_PHONE)

    mManager.updateProperties(view, buildStyles("keyboardType", "number-pad"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(numberPadTypeFlags)

    mManager.updateProperties(view, buildStyles("keyboardType", "decimal-pad"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(decimalPadTypeFlags)
  }

  @Test
  fun testKeyboardTypeNumeric() {
    val numericTypeFlags = (InputType.TYPE_CLASS_NUMBER
      or InputType.TYPE_NUMBER_FLAG_DECIMAL
      or InputType.TYPE_NUMBER_FLAG_SIGNED)

    mManager.updateProperties(view, buildStyles("keyboardType", "numeric"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(numericTypeFlags)
  }

  @Test
  fun testKeyboardTypeEmail() {
    val emailTypeFlags = InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS or InputType.TYPE_CLASS_TEXT

    mManager.updateProperties(view, buildStyles("keyboardType", "email-address"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(emailTypeFlags)
  }

  @Test
  fun testKeyboardTypeUrl() {
    mManager.updateProperties(view, buildStyles("keyboardType", "url"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(InputType.TYPE_TEXT_VARIATION_URI)
  }

  @Test
  fun testKeyboardTypeVisiblePassword() {
    val passwordVisibilityFlag =
      InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD and InputType.TYPE_TEXT_VARIATION_PASSWORD.inv()

    mManager.updateProperties(view, buildStyles("keyboardType", "visible-password"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(passwordVisibilityFlag)
  }

  @Test
  fun testPasswordInput() {
    mManager.updateProperties(view, buildStyles())
    assertThat(view.inputType and InputType.TYPE_TEXT_VARIATION_PASSWORD).isZero

    mManager.updateProperties(view, buildStyles("secureTextEntry", false))
    assertThat(view.inputType and InputType.TYPE_TEXT_VARIATION_PASSWORD).isZero

    mManager.updateProperties(view, buildStyles("secureTextEntry", true))
    assertThat(view.inputType and InputType.TYPE_TEXT_VARIATION_PASSWORD).isNotZero

    mManager.updateProperties(view, buildStyles("secureTextEntry", null))
    assertThat(view.inputType and InputType.TYPE_TEXT_VARIATION_PASSWORD).isZero
  }

  @Test
  fun testIncrementalInputTypeUpdates() {
    mManager.updateProperties(view, buildStyles())
    assertThat(view.inputType and InputType.TYPE_CLASS_NUMBER).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero

    mManager.updateProperties(view, buildStyles("multiline", true))
    assertThat(view.inputType and InputType.TYPE_CLASS_NUMBER).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero

    mManager.updateProperties(view, buildStyles("autoCorrect", false))
    assertThat(view.inputType and InputType.TYPE_CLASS_NUMBER).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isNotZero

    mManager.updateProperties(view, buildStyles("keyboardType", "NUMERIC"))
    assertThat(view.inputType and InputType.TYPE_CLASS_NUMBER).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isNotZero

    mManager.updateProperties(view, buildStyles("multiline", null))
    assertThat(view.inputType and InputType.TYPE_CLASS_NUMBER).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isNotZero
  }

  @Test
  fun testTextAlign() {
    val view = mManager.createViewInstance(mThemedContext)
    val defaultGravity = view.gravity
    val defaultHorizontalGravity = defaultGravity and Gravity.HORIZONTAL_GRAVITY_MASK
    val defaultVerticalGravity = defaultGravity and Gravity.VERTICAL_GRAVITY_MASK

    assertThat(view.gravity).isNotEqualTo(Gravity.NO_GRAVITY)

    // region TextAlign
    mManager.updateProperties(view, buildStyles("textAlign", "left"))
    assertThat(view.gravity and Gravity.HORIZONTAL_GRAVITY_MASK).isEqualTo(Gravity.LEFT)

    mManager.updateProperties(view, buildStyles("textAlign", "right"))
    assertThat(view.gravity and Gravity.HORIZONTAL_GRAVITY_MASK).isEqualTo(Gravity.RIGHT)

    mManager.updateProperties(view, buildStyles("textAlign", "center"))
    assertThat(view.gravity and Gravity.HORIZONTAL_GRAVITY_MASK).isEqualTo(Gravity.CENTER_HORIZONTAL)

    mManager.updateProperties(view, buildStyles("textAlign", null))
    assertThat(view.gravity and Gravity.HORIZONTAL_GRAVITY_MASK).isEqualTo(defaultHorizontalGravity)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      mManager.updateProperties(view, buildStyles("textAlign", "justify"))
      assertThat(view.justificationMode).isEqualTo(Layout.JUSTIFICATION_MODE_INTER_WORD)
    }
    // endregion

    // region TextAlignVertical
    mManager.updateProperties(view, buildStyles("textAlignVertical", "top"))
    assertThat(view.gravity and Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(Gravity.TOP)

    mManager.updateProperties(view, buildStyles("textAlignVertical", "bottom"))
    assertThat(view.gravity and Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(Gravity.BOTTOM)

    mManager.updateProperties(view, buildStyles("textAlignVertical", "center"))
    assertThat(view.gravity and Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(Gravity.CENTER_VERTICAL)

    mManager.updateProperties(view, buildStyles("textAlignVertical", null))
    assertThat(view.gravity and Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(defaultVerticalGravity)
    // endregion

    // region TextAlign + TextAlignVertical
    mManager.updateProperties(
      view,
      buildStyles("textAlign", "center", "textAlignVertical", "center")
    )
    assertThat(view.gravity).isEqualTo(Gravity.CENTER)

    mManager.updateProperties(
      view,
      buildStyles("textAlign", "right", "textAlignVertical", "bottom")
    )
    assertThat(view.gravity).isEqualTo(Gravity.RIGHT or Gravity.BOTTOM)

    mManager.updateProperties(view, buildStyles("textAlign", null, "textAlignVertical", null))
    assertThat(view.gravity).isEqualTo(defaultGravity)
    // endregion
  }

  @Test
  fun testMaxLength() {
    val filters = arrayOf<InputFilter>(AllCaps())
    view.filters = filters
    mManager.setMaxLength(view, null)
    assertThat(view.filters).isEqualTo(filters)
  }

  private fun buildStyles(vararg keysAndValues: Any?): ReactStylesDiffMap {
    return ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
  }
}

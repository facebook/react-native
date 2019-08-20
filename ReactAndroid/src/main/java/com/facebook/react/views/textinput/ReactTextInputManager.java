/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.views.textinput;

import android.graphics.PorterDuff;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.text.Editable;
import android.text.InputFilter;
import android.text.InputType;
import android.text.Layout;
import android.text.Spannable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper;
import com.facebook.react.views.scroll.ScrollEvent;
import com.facebook.react.views.scroll.ScrollEventType;
import com.facebook.react.views.text.DefaultStyleValuesUtil;
import com.facebook.react.views.text.ReactFontManager;
import com.facebook.react.views.text.ReactTextUpdate;
import com.facebook.react.views.text.TextInlineImageSpan;
import com.facebook.yoga.YogaConstants;
import java.lang.reflect.Field;
import java.util.LinkedList;
import java.util.Map;

/** Manages instances of TextInput. */
@ReactModule(name = ReactTextInputManager.REACT_CLASS)
public class ReactTextInputManager extends BaseViewManager<ReactEditText, LayoutShadowNode> {
  public static final String TAG = ReactTextInputManager.class.getSimpleName();
  protected static final String REACT_CLASS = "AndroidTextInput";

  private static final int[] SPACING_TYPES = {
    Spacing.ALL, Spacing.LEFT, Spacing.RIGHT, Spacing.TOP, Spacing.BOTTOM,
  };

  private static final int FOCUS_TEXT_INPUT = 1;
  private static final int BLUR_TEXT_INPUT = 2;

  private static final int INPUT_TYPE_KEYBOARD_NUMBER_PAD = InputType.TYPE_CLASS_NUMBER;
  private static final int INPUT_TYPE_KEYBOARD_DECIMAL_PAD =
      INPUT_TYPE_KEYBOARD_NUMBER_PAD | InputType.TYPE_NUMBER_FLAG_DECIMAL;
  private static final int INPUT_TYPE_KEYBOARD_NUMBERED =
      INPUT_TYPE_KEYBOARD_DECIMAL_PAD | InputType.TYPE_NUMBER_FLAG_SIGNED;
  private static final int PASSWORD_VISIBILITY_FLAG =
      InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD & ~InputType.TYPE_TEXT_VARIATION_PASSWORD;
  private static final int KEYBOARD_TYPE_FLAGS =
      INPUT_TYPE_KEYBOARD_NUMBERED
          | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
          | InputType.TYPE_CLASS_TEXT
          | InputType.TYPE_CLASS_PHONE
          | PASSWORD_VISIBILITY_FLAG;

  private static final String KEYBOARD_TYPE_EMAIL_ADDRESS = "email-address";
  private static final String KEYBOARD_TYPE_NUMERIC = "numeric";
  private static final String KEYBOARD_TYPE_DECIMAL_PAD = "decimal-pad";
  private static final String KEYBOARD_TYPE_NUMBER_PAD = "number-pad";
  private static final String KEYBOARD_TYPE_PHONE_PAD = "phone-pad";
  private static final String KEYBOARD_TYPE_VISIBLE_PASSWORD = "visible-password";
  private static final InputFilter[] EMPTY_FILTERS = new InputFilter[0];
  private static final int UNSET = -1;

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactEditText createViewInstance(ThemedReactContext context) {
    ReactEditText editText = new ReactEditText(context);
    int inputType = editText.getInputType();
    editText.setInputType(inputType & (~InputType.TYPE_TEXT_FLAG_MULTI_LINE));
    editText.setReturnKeyType("done");
    return editText;
  }

  @Override
  public LayoutShadowNode createShadowNodeInstance() {
    return new ReactTextInputShadowNode();
  }

  @Override
  public Class<? extends LayoutShadowNode> getShadowNodeClass() {
    return ReactTextInputShadowNode.class;
  }

  @Nullable
  @Override
  public Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
        .put(
            "topSubmitEditing",
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onSubmitEditing", "captured", "onSubmitEditingCapture")))
        .put(
            "topEndEditing",
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onEndEditing", "captured", "onEndEditingCapture")))
        .put(
            "topTextInput",
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onTextInput", "captured", "onTextInputCapture")))
        .put(
            "topFocus",
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onFocus", "captured", "onFocusCapture")))
        .put(
            "topBlur",
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onBlur", "captured", "onBlurCapture")))
        .put(
            "topKeyPress",
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onKeyPress", "captured", "onKeyPressCapture")))
        .build();
  }

  @Nullable
  @Override
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
        .put(
            ScrollEventType.getJSEventName(ScrollEventType.SCROLL),
            MapBuilder.of("registrationName", "onScroll"))
        .build();
  }

  @Override
  public @Nullable Map<String, Integer> getCommandsMap() {
    return MapBuilder.of("focusTextInput", FOCUS_TEXT_INPUT, "blurTextInput", BLUR_TEXT_INPUT);
  }

  @Override
  public void receiveCommand(
      ReactEditText reactEditText, int commandId, @Nullable ReadableArray args) {
    switch (commandId) {
      case FOCUS_TEXT_INPUT:
        reactEditText.requestFocusFromJS();
        break;
      case BLUR_TEXT_INPUT:
        reactEditText.clearFocusFromJS();
        break;
    }
  }

  @Override
  public void receiveCommand(
      ReactEditText reactEditText, String commandId, @Nullable ReadableArray args) {
    switch (commandId) {
      case "focus":
      case "focusTextInput":
        reactEditText.requestFocusFromJS();
        break;
      case "blur":
      case "blurTextInput":
        reactEditText.clearFocusFromJS();
        break;
    }
  }

  @Override
  public void updateExtraData(ReactEditText view, Object extraData) {
    if (extraData instanceof ReactTextUpdate) {
      ReactTextUpdate update = (ReactTextUpdate) extraData;

      view.setPadding(
          (int) update.getPaddingLeft(),
          (int) update.getPaddingTop(),
          (int) update.getPaddingRight(),
          (int) update.getPaddingBottom());

      if (update.containsImages()) {
        Spannable spannable = update.getText();
        TextInlineImageSpan.possiblyUpdateInlineImageSpans(spannable, view);
      }
      view.maybeSetText(update);
      if (update.getSelectionStart() != UNSET && update.getSelectionEnd() != UNSET)
        view.setSelection(update.getSelectionStart(), update.getSelectionEnd());
    }
  }

  @ReactProp(name = ViewProps.FONT_SIZE, defaultFloat = ViewDefaults.FONT_SIZE_SP)
  public void setFontSize(ReactEditText view, float fontSize) {
    view.setFontSize(fontSize);
  }

  @ReactProp(name = ViewProps.FONT_FAMILY)
  public void setFontFamily(ReactEditText view, String fontFamily) {
    int style = Typeface.NORMAL;
    if (view.getTypeface() != null) {
      style = view.getTypeface().getStyle();
    }
    Typeface newTypeface =
        ReactFontManager.getInstance()
            .getTypeface(fontFamily, style, view.getContext().getAssets());
    view.setTypeface(newTypeface);
  }

  @ReactProp(name = ViewProps.MAX_FONT_SIZE_MULTIPLIER, defaultFloat = Float.NaN)
  public void setMaxFontSizeMultiplier(ReactEditText view, float maxFontSizeMultiplier) {
    view.setMaxFontSizeMultiplier(maxFontSizeMultiplier);
  }

  /**
   * /* This code was taken from the method setFontWeight of the class ReactTextShadowNode /* TODO:
   * Factor into a common place they can both use
   */
  @ReactProp(name = ViewProps.FONT_WEIGHT)
  public void setFontWeight(ReactEditText view, @Nullable String fontWeightString) {
    int fontWeightNumeric =
        fontWeightString != null ? parseNumericFontWeight(fontWeightString) : -1;
    int fontWeight = UNSET;
    if (fontWeightNumeric >= 500 || "bold".equals(fontWeightString)) {
      fontWeight = Typeface.BOLD;
    } else if ("normal".equals(fontWeightString)
        || (fontWeightNumeric != -1 && fontWeightNumeric < 500)) {
      fontWeight = Typeface.NORMAL;
    }
    Typeface currentTypeface = view.getTypeface();
    if (currentTypeface == null) {
      currentTypeface = Typeface.DEFAULT;
    }
    if (fontWeight != currentTypeface.getStyle()) {
      view.setTypeface(currentTypeface, fontWeight);
    }
  }

  /**
   * /* This code was taken from the method setFontStyle of the class ReactTextShadowNode /* TODO:
   * Factor into a common place they can both use
   */
  @ReactProp(name = ViewProps.FONT_STYLE)
  public void setFontStyle(ReactEditText view, @Nullable String fontStyleString) {
    int fontStyle = UNSET;
    if ("italic".equals(fontStyleString)) {
      fontStyle = Typeface.ITALIC;
    } else if ("normal".equals(fontStyleString)) {
      fontStyle = Typeface.NORMAL;
    }

    Typeface currentTypeface = view.getTypeface();
    if (currentTypeface == null) {
      currentTypeface = Typeface.DEFAULT;
    }
    if (fontStyle != currentTypeface.getStyle()) {
      view.setTypeface(currentTypeface, fontStyle);
    }
  }

  @ReactProp(name = "importantForAutofill")
  public void setImportantForAutofill(ReactEditText view, @Nullable String value) {
    int mode = View.IMPORTANT_FOR_AUTOFILL_AUTO;
    if ("no".equals(value)) {
      mode = View.IMPORTANT_FOR_AUTOFILL_NO;
    } else if ("noExcludeDescendants".equals(value)) {
      mode = View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS;
    } else if ("yes".equals(value)) {
      mode = View.IMPORTANT_FOR_AUTOFILL_YES;
    } else if ("yesExcludeDescendants".equals(value)) {
      mode = View.IMPORTANT_FOR_AUTOFILL_YES_EXCLUDE_DESCENDANTS;
    }
    setImportantForAutofill(view, mode);
  }

  private void setImportantForAutofill(ReactEditText view, int mode) {
    // Autofill hints were added in Android API 26.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }
    view.setImportantForAutofill(mode);
  }

  private void setAutofillHints(ReactEditText view, String... hints) {
    // Autofill hints were added in Android API 26.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }
    view.setAutofillHints(hints);
  }

  @ReactProp(name = "onSelectionChange", defaultBoolean = false)
  public void setOnSelectionChange(final ReactEditText view, boolean onSelectionChange) {
    if (onSelectionChange) {
      view.setSelectionWatcher(new ReactSelectionWatcher(view));
    } else {
      view.setSelectionWatcher(null);
    }
  }

  @ReactProp(name = "blurOnSubmit")
  public void setBlurOnSubmit(ReactEditText view, @Nullable Boolean blurOnSubmit) {
    view.setBlurOnSubmit(blurOnSubmit);
  }

  @ReactProp(name = "onContentSizeChange", defaultBoolean = false)
  public void setOnContentSizeChange(final ReactEditText view, boolean onContentSizeChange) {
    if (onContentSizeChange) {
      view.setContentSizeWatcher(new ReactContentSizeWatcher(view));
    } else {
      view.setContentSizeWatcher(null);
    }
  }

  @ReactProp(name = "onScroll", defaultBoolean = false)
  public void setOnScroll(final ReactEditText view, boolean onScroll) {
    if (onScroll) {
      view.setScrollWatcher(new ReactScrollWatcher(view));
    } else {
      view.setScrollWatcher(null);
    }
  }

  @ReactProp(name = "onKeyPress", defaultBoolean = false)
  public void setOnKeyPress(final ReactEditText view, boolean onKeyPress) {
    view.setOnKeyPress(onKeyPress);
  }

  // Sets the letter spacing as an absolute point size.
  // This extra handling, on top of what ReactBaseTextShadowNode already does, is required for the
  // correct display of spacing in placeholder (hint) text.
  @ReactProp(name = ViewProps.LETTER_SPACING, defaultFloat = 0)
  public void setLetterSpacing(ReactEditText view, float letterSpacing) {
    view.setLetterSpacingPt(letterSpacing);
  }

  @ReactProp(name = ViewProps.ALLOW_FONT_SCALING, defaultBoolean = true)
  public void setAllowFontScaling(ReactEditText view, boolean allowFontScaling) {
    view.setAllowFontScaling(allowFontScaling);
  }

  @ReactProp(name = "placeholder")
  public void setPlaceholder(ReactEditText view, @Nullable String placeholder) {
    view.setHint(placeholder);
  }

  @ReactProp(name = "placeholderTextColor", customType = "Color")
  public void setPlaceholderTextColor(ReactEditText view, @Nullable Integer color) {
    if (color == null) {
      view.setHintTextColor(DefaultStyleValuesUtil.getDefaultTextColorHint(view.getContext()));
    } else {
      view.setHintTextColor(color);
    }
  }

  @ReactProp(name = "selectionColor", customType = "Color")
  public void setSelectionColor(ReactEditText view, @Nullable Integer color) {
    if (color == null) {
      view.setHighlightColor(
          DefaultStyleValuesUtil.getDefaultTextColorHighlight(view.getContext()));
    } else {
      view.setHighlightColor(color);
    }

    setCursorColor(view, color);
  }

  @ReactProp(name = "cursorColor", customType = "Color")
  public void setCursorColor(ReactEditText view, @Nullable Integer color) {
    // Evil method that uses reflection because there is no public API to changes
    // the cursor color programmatically.
    // Based on
    // http://stackoverflow.com/questions/25996032/how-to-change-programatically-edittext-cursor-color-in-android.
    try {
      // Get the original cursor drawable resource.
      Field cursorDrawableResField = TextView.class.getDeclaredField("mCursorDrawableRes");
      cursorDrawableResField.setAccessible(true);
      int drawableResId = cursorDrawableResField.getInt(view);

      // The view has no cursor drawable.
      if (drawableResId == 0) {
        return;
      }

      Drawable drawable = ContextCompat.getDrawable(view.getContext(), drawableResId);
      if (color != null) {
        drawable.setColorFilter(color, PorterDuff.Mode.SRC_IN);
      }
      Drawable[] drawables = {drawable, drawable};

      // Update the current cursor drawable with the new one.
      Field editorField = TextView.class.getDeclaredField("mEditor");
      editorField.setAccessible(true);
      Object editor = editorField.get(view);
      Field cursorDrawableField = editor.getClass().getDeclaredField("mCursorDrawable");
      cursorDrawableField.setAccessible(true);
      cursorDrawableField.set(editor, drawables);
    } catch (NoSuchFieldException ex) {
      // Ignore errors to avoid crashing if these private fields don't exist on modified
      // or future android versions.
    } catch (IllegalAccessException ex) {
    }
  }

  @ReactProp(name = "mostRecentEventCount", defaultInt = 0)
  public void setMostRecentEventCount(ReactEditText view, int mostRecentEventCount) {
    view.setMostRecentEventCount(mostRecentEventCount);
  }

  @ReactProp(name = "caretHidden", defaultBoolean = false)
  public void setCaretHidden(ReactEditText view, boolean caretHidden) {
    view.setCursorVisible(!caretHidden);
  }

  @ReactProp(name = "contextMenuHidden", defaultBoolean = false)
  public void setContextMenuHidden(ReactEditText view, boolean contextMenuHidden) {
    final boolean _contextMenuHidden = contextMenuHidden;
    view.setOnLongClickListener(
        new View.OnLongClickListener() {
          public boolean onLongClick(View v) {
            return _contextMenuHidden;
          };
        });
  }

  @ReactProp(name = "selectTextOnFocus", defaultBoolean = false)
  public void setSelectTextOnFocus(ReactEditText view, boolean selectTextOnFocus) {
    view.setSelectAllOnFocus(selectTextOnFocus);
  }

  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  public void setColor(ReactEditText view, @Nullable Integer color) {
    if (color == null) {
      view.setTextColor(DefaultStyleValuesUtil.getDefaultTextColor(view.getContext()));
    } else {
      view.setTextColor(color);
    }
  }

  @ReactProp(name = "underlineColorAndroid", customType = "Color")
  public void setUnderlineColor(ReactEditText view, @Nullable Integer underlineColor) {
    // Drawable.mutate() can sometimes crash due to an AOSP bug:
    // See https://code.google.com/p/android/issues/detail?id=191754 for more info
    Drawable background = view.getBackground();
    Drawable drawableToMutate = background;
    if (background.getConstantState() != null) {
      try {
        drawableToMutate = background.mutate();
      } catch (NullPointerException e) {
        FLog.e(TAG, "NullPointerException when setting underlineColorAndroid for TextInput", e);
      }
    }

    if (underlineColor == null) {
      drawableToMutate.clearColorFilter();
    } else {
      drawableToMutate.setColorFilter(underlineColor, PorterDuff.Mode.SRC_IN);
    }
  }

  @ReactProp(name = ViewProps.TEXT_ALIGN)
  public void setTextAlign(ReactEditText view, @Nullable String textAlign) {
    if ("justify".equals(textAlign)) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        view.setJustificationMode(Layout.JUSTIFICATION_MODE_INTER_WORD);
      }
      view.setGravityHorizontal(Gravity.LEFT);
    } else {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        view.setJustificationMode(Layout.JUSTIFICATION_MODE_NONE);
      }

      if (textAlign == null || "auto".equals(textAlign)) {
        view.setGravityHorizontal(Gravity.NO_GRAVITY);
      } else if ("left".equals(textAlign)) {
        view.setGravityHorizontal(Gravity.LEFT);
      } else if ("right".equals(textAlign)) {
        view.setGravityHorizontal(Gravity.RIGHT);
      } else if ("center".equals(textAlign)) {
        view.setGravityHorizontal(Gravity.CENTER_HORIZONTAL);
      } else {
        throw new JSApplicationIllegalArgumentException("Invalid textAlign: " + textAlign);
      }
    }
  }

  @ReactProp(name = ViewProps.TEXT_ALIGN_VERTICAL)
  public void setTextAlignVertical(ReactEditText view, @Nullable String textAlignVertical) {
    if (textAlignVertical == null || "auto".equals(textAlignVertical)) {
      view.setGravityVertical(Gravity.NO_GRAVITY);
    } else if ("top".equals(textAlignVertical)) {
      view.setGravityVertical(Gravity.TOP);
    } else if ("bottom".equals(textAlignVertical)) {
      view.setGravityVertical(Gravity.BOTTOM);
    } else if ("center".equals(textAlignVertical)) {
      view.setGravityVertical(Gravity.CENTER_VERTICAL);
    } else {
      throw new JSApplicationIllegalArgumentException(
          "Invalid textAlignVertical: " + textAlignVertical);
    }
  }

  @ReactProp(name = "inlineImageLeft")
  public void setInlineImageLeft(ReactEditText view, @Nullable String resource) {
    int id =
        ResourceDrawableIdHelper.getInstance().getResourceDrawableId(view.getContext(), resource);
    view.setCompoundDrawablesWithIntrinsicBounds(id, 0, 0, 0);
  }

  @ReactProp(name = "inlineImagePadding")
  public void setInlineImagePadding(ReactEditText view, int padding) {
    view.setCompoundDrawablePadding(padding);
  }

  @ReactProp(name = "editable", defaultBoolean = true)
  public void setEditable(ReactEditText view, boolean editable) {
    view.setEnabled(editable);
  }

  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = 1)
  public void setNumLines(ReactEditText view, int numLines) {
    view.setLines(numLines);
  }

  @ReactProp(name = "maxLength")
  public void setMaxLength(ReactEditText view, @Nullable Integer maxLength) {
    InputFilter[] currentFilters = view.getFilters();
    InputFilter[] newFilters = EMPTY_FILTERS;

    if (maxLength == null) {
      if (currentFilters.length > 0) {
        LinkedList<InputFilter> list = new LinkedList<>();
        for (int i = 0; i < currentFilters.length; i++) {
          if (!(currentFilters[i] instanceof InputFilter.LengthFilter)) {
            list.add(currentFilters[i]);
          }
        }
        if (!list.isEmpty()) {
          newFilters = (InputFilter[]) list.toArray(new InputFilter[list.size()]);
        }
      }
    } else {
      if (currentFilters.length > 0) {
        newFilters = currentFilters;
        boolean replaced = false;
        for (int i = 0; i < currentFilters.length; i++) {
          if (currentFilters[i] instanceof InputFilter.LengthFilter) {
            currentFilters[i] = new InputFilter.LengthFilter(maxLength);
            replaced = true;
          }
        }
        if (!replaced) {
          newFilters = new InputFilter[currentFilters.length + 1];
          System.arraycopy(currentFilters, 0, newFilters, 0, currentFilters.length);
          currentFilters[currentFilters.length] = new InputFilter.LengthFilter(maxLength);
        }
      } else {
        newFilters = new InputFilter[1];
        newFilters[0] = new InputFilter.LengthFilter(maxLength);
      }
    }

    view.setFilters(newFilters);
  }

  @ReactProp(name = "autoCompleteType")
  public void setTextContentType(ReactEditText view, @Nullable String autoCompleteType) {
    if (autoCompleteType == null) {
      setImportantForAutofill(view, View.IMPORTANT_FOR_AUTOFILL_NO);
    } else if ("username".equals(autoCompleteType)) {
      setAutofillHints(view, View.AUTOFILL_HINT_USERNAME);
    } else if ("password".equals(autoCompleteType)) {
      setAutofillHints(view, View.AUTOFILL_HINT_PASSWORD);
    } else if ("email".equals(autoCompleteType)) {
      setAutofillHints(view, View.AUTOFILL_HINT_EMAIL_ADDRESS);
    } else if ("name".equals(autoCompleteType)) {
      setAutofillHints(view, View.AUTOFILL_HINT_NAME);
    } else if ("tel".equals(autoCompleteType)) {
      setAutofillHints(view, View.AUTOFILL_HINT_PHONE);
    } else if ("street-address".equals(autoCompleteType)) {
      setAutofillHints(view, View.AUTOFILL_HINT_POSTAL_ADDRESS);
    } else if ("postal-code".equals(autoCompleteType)) {
      setAutofillHints(view, View.AUTOFILL_HINT_POSTAL_CODE);
    } else if ("cc-number".equals(autoCompleteType)) {
      setAutofillHints(view, View.AUTOFILL_HINT_CREDIT_CARD_NUMBER);
    } else if ("cc-csc".equals(autoCompleteType)) {
      setAutofillHints(view, View.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE);
    } else if ("cc-exp".equals(autoCompleteType)) {
      setAutofillHints(view, View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DATE);
    } else if ("cc-exp-month".equals(autoCompleteType)) {
      setAutofillHints(view, View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_MONTH);
    } else if ("cc-exp-year".equals(autoCompleteType)) {
      setAutofillHints(view, View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_YEAR);
    } else if ("off".equals(autoCompleteType)) {
      setImportantForAutofill(view, View.IMPORTANT_FOR_AUTOFILL_NO);
    } else {
      throw new JSApplicationIllegalArgumentException(
          "Invalid autoCompleteType: " + autoCompleteType);
    }
  }

  @ReactProp(name = "autoCorrect")
  public void setAutoCorrect(ReactEditText view, @Nullable Boolean autoCorrect) {
    // clear auto correct flags, set SUGGESTIONS or NO_SUGGESTIONS depending on value
    updateStagedInputTypeFlag(
        view,
        InputType.TYPE_TEXT_FLAG_AUTO_CORRECT | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS,
        autoCorrect != null
            ? (autoCorrect.booleanValue()
                ? InputType.TYPE_TEXT_FLAG_AUTO_CORRECT
                : InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS)
            : 0);
  }

  @ReactProp(name = "multiline", defaultBoolean = false)
  public void setMultiline(ReactEditText view, boolean multiline) {
    updateStagedInputTypeFlag(
        view,
        multiline ? 0 : InputType.TYPE_TEXT_FLAG_MULTI_LINE,
        multiline ? InputType.TYPE_TEXT_FLAG_MULTI_LINE : 0);
  }

  @ReactProp(name = "secureTextEntry", defaultBoolean = false)
  public void setSecureTextEntry(ReactEditText view, boolean password) {
    updateStagedInputTypeFlag(
        view,
        password
            ? 0
            : InputType.TYPE_NUMBER_VARIATION_PASSWORD | InputType.TYPE_TEXT_VARIATION_PASSWORD,
        password ? InputType.TYPE_TEXT_VARIATION_PASSWORD : 0);
    checkPasswordType(view);
  }

  // This prop temporarily takes both numbers and strings.
  // Number values are deprecated and will be removed in a future release.
  // See T46146267
  @ReactProp(name = "autoCapitalize")
  public void setAutoCapitalize(ReactEditText view, Dynamic autoCapitalize) {
    int autoCapitalizeValue = InputType.TYPE_TEXT_FLAG_CAP_SENTENCES;

    if (autoCapitalize.getType() == ReadableType.Number) {
      autoCapitalizeValue = autoCapitalize.asInt();
    } else if (autoCapitalize.getType() == ReadableType.String) {
      final String autoCapitalizeStr = autoCapitalize.asString();

      if (autoCapitalizeStr.equals("none")) {
        autoCapitalizeValue = 0;
      } else if (autoCapitalizeStr.equals("characters")) {
        autoCapitalizeValue = InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS;
      } else if (autoCapitalizeStr.equals("words")) {
        autoCapitalizeValue = InputType.TYPE_TEXT_FLAG_CAP_WORDS;
      } else if (autoCapitalizeStr.equals("sentences")) {
        autoCapitalizeValue = InputType.TYPE_TEXT_FLAG_CAP_SENTENCES;
      }
    }

    updateStagedInputTypeFlag(
        view,
        InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
            | InputType.TYPE_TEXT_FLAG_CAP_WORDS
            | InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS,
        autoCapitalizeValue);
  }

  @ReactProp(name = "keyboardType")
  public void setKeyboardType(ReactEditText view, @Nullable String keyboardType) {
    int flagsToSet = InputType.TYPE_CLASS_TEXT;
    if (KEYBOARD_TYPE_NUMERIC.equalsIgnoreCase(keyboardType)) {
      flagsToSet = INPUT_TYPE_KEYBOARD_NUMBERED;
    } else if (KEYBOARD_TYPE_NUMBER_PAD.equalsIgnoreCase(keyboardType)) {
      flagsToSet = INPUT_TYPE_KEYBOARD_NUMBER_PAD;
    } else if (KEYBOARD_TYPE_DECIMAL_PAD.equalsIgnoreCase(keyboardType)) {
      flagsToSet = INPUT_TYPE_KEYBOARD_DECIMAL_PAD;
    } else if (KEYBOARD_TYPE_EMAIL_ADDRESS.equalsIgnoreCase(keyboardType)) {
      flagsToSet = InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS | InputType.TYPE_CLASS_TEXT;
    } else if (KEYBOARD_TYPE_PHONE_PAD.equalsIgnoreCase(keyboardType)) {
      flagsToSet = InputType.TYPE_CLASS_PHONE;
    } else if (KEYBOARD_TYPE_VISIBLE_PASSWORD.equalsIgnoreCase(keyboardType)) {
      // This will supercede secureTextEntry={false}. If it doesn't, due to the way
      //  the flags work out, the underlying field will end up a URI-type field.
      flagsToSet = InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD;
    }
    updateStagedInputTypeFlag(view, KEYBOARD_TYPE_FLAGS, flagsToSet);
    checkPasswordType(view);
  }

  @ReactProp(name = "returnKeyType")
  public void setReturnKeyType(ReactEditText view, String returnKeyType) {
    view.setReturnKeyType(returnKeyType);
  }

  @ReactProp(name = "disableFullscreenUI", defaultBoolean = false)
  public void setDisableFullscreenUI(ReactEditText view, boolean disableFullscreenUI) {
    view.setDisableFullscreenUI(disableFullscreenUI);
  }

  private static final int IME_ACTION_ID = 0x670;

  @ReactProp(name = "returnKeyLabel")
  public void setReturnKeyLabel(ReactEditText view, String returnKeyLabel) {
    view.setImeActionLabel(returnKeyLabel, IME_ACTION_ID);
  }

  @ReactPropGroup(
      names = {
        ViewProps.BORDER_RADIUS,
        ViewProps.BORDER_TOP_LEFT_RADIUS,
        ViewProps.BORDER_TOP_RIGHT_RADIUS,
        ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
        ViewProps.BORDER_BOTTOM_LEFT_RADIUS
      },
      defaultFloat = YogaConstants.UNDEFINED)
  public void setBorderRadius(ReactEditText view, int index, float borderRadius) {
    if (!YogaConstants.isUndefined(borderRadius)) {
      borderRadius = PixelUtil.toPixelFromDIP(borderRadius);
    }

    if (index == 0) {
      view.setBorderRadius(borderRadius);
    } else {
      view.setBorderRadius(borderRadius, index - 1);
    }
  }

  @ReactProp(name = "borderStyle")
  public void setBorderStyle(ReactEditText view, @Nullable String borderStyle) {
    view.setBorderStyle(borderStyle);
  }

  @ReactProp(name = "showSoftInputOnFocus", defaultBoolean = true)
  public void showKeyboardOnFocus(ReactEditText view, boolean showKeyboardOnFocus) {
    view.setShowSoftInputOnFocus(showKeyboardOnFocus);
  }

  @ReactPropGroup(
      names = {
        ViewProps.BORDER_WIDTH,
        ViewProps.BORDER_LEFT_WIDTH,
        ViewProps.BORDER_RIGHT_WIDTH,
        ViewProps.BORDER_TOP_WIDTH,
        ViewProps.BORDER_BOTTOM_WIDTH,
      },
      defaultFloat = YogaConstants.UNDEFINED)
  public void setBorderWidth(ReactEditText view, int index, float width) {
    if (!YogaConstants.isUndefined(width)) {
      width = PixelUtil.toPixelFromDIP(width);
    }
    view.setBorderWidth(SPACING_TYPES[index], width);
  }

  @ReactPropGroup(
      names = {
        "borderColor",
        "borderLeftColor",
        "borderRightColor",
        "borderTopColor",
        "borderBottomColor"
      },
      customType = "Color")
  public void setBorderColor(ReactEditText view, int index, Integer color) {
    float rgbComponent =
        color == null ? YogaConstants.UNDEFINED : (float) ((int) color & 0x00FFFFFF);
    float alphaComponent = color == null ? YogaConstants.UNDEFINED : (float) ((int) color >>> 24);
    view.setBorderColor(SPACING_TYPES[index], rgbComponent, alphaComponent);
  }

  @Override
  protected void onAfterUpdateTransaction(ReactEditText view) {
    super.onAfterUpdateTransaction(view);
    view.commitStagedInputType();
  }

  // Sets the correct password type, since numeric and text passwords have different types
  private static void checkPasswordType(ReactEditText view) {
    if ((view.getStagedInputType() & INPUT_TYPE_KEYBOARD_NUMBERED) != 0
        && (view.getStagedInputType() & InputType.TYPE_TEXT_VARIATION_PASSWORD) != 0) {
      // Text input type is numbered password, remove text password variation, add numeric one
      updateStagedInputTypeFlag(
          view, InputType.TYPE_TEXT_VARIATION_PASSWORD, InputType.TYPE_NUMBER_VARIATION_PASSWORD);
    }
  }

  /**
   * This code was taken from the method parseNumericFontWeight of the class ReactTextShadowNode
   * TODO: Factor into a common place they can both use
   *
   * <p>Return -1 if the input string is not a valid numeric fontWeight (100, 200, ..., 900),
   * otherwise return the weight.
   */
  private static int parseNumericFontWeight(String fontWeightString) {
    // This should be much faster than using regex to verify input and Integer.parseInt
    return fontWeightString.length() == 3
            && fontWeightString.endsWith("00")
            && fontWeightString.charAt(0) <= '9'
            && fontWeightString.charAt(0) >= '1'
        ? 100 * (fontWeightString.charAt(0) - '0')
        : -1;
  }

  private static void updateStagedInputTypeFlag(
      ReactEditText view, int flagsToUnset, int flagsToSet) {
    view.setStagedInputType((view.getStagedInputType() & ~flagsToUnset) | flagsToSet);
  }

  private class ReactTextInputTextWatcher implements TextWatcher {

    private EventDispatcher mEventDispatcher;
    private ReactEditText mEditText;
    private String mPreviousText;

    public ReactTextInputTextWatcher(
        final ReactContext reactContext, final ReactEditText editText) {
      mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
      mEditText = editText;
      mPreviousText = null;
    }

    @Override
    public void beforeTextChanged(CharSequence s, int start, int count, int after) {
      // Incoming charSequence gets mutated before onTextChanged() is invoked
      mPreviousText = s.toString();
    }

    @Override
    public void onTextChanged(CharSequence s, int start, int before, int count) {
      // Rearranging the text (i.e. changing between singleline and multiline attributes) can
      // also trigger onTextChanged, call the event in JS only when the text actually changed
      if (count == 0 && before == 0) {
        return;
      }

      Assertions.assertNotNull(mPreviousText);
      String newText = s.toString().substring(start, start + count);
      String oldText = mPreviousText.substring(start, start + before);
      // Don't send same text changes
      if (count == before && newText.equals(oldText)) {
        return;
      }

      // The event that contains the event counter and updates it must be sent first.
      // TODO: t7936714 merge these events
      mEventDispatcher.dispatchEvent(
          new ReactTextChangedEvent(
              mEditText.getId(), s.toString(), mEditText.incrementAndGetEventCounter()));

      mEventDispatcher.dispatchEvent(
          new ReactTextInputEvent(mEditText.getId(), newText, oldText, start, start + before));
    }

    @Override
    public void afterTextChanged(Editable s) {}
  }

  @Override
  protected void addEventEmitters(
      final ThemedReactContext reactContext, final ReactEditText editText) {
    editText.addTextChangedListener(new ReactTextInputTextWatcher(reactContext, editText));
    editText.setOnFocusChangeListener(
        new View.OnFocusChangeListener() {
          public void onFocusChange(View v, boolean hasFocus) {
            EventDispatcher eventDispatcher =
                reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
            if (hasFocus) {
              eventDispatcher.dispatchEvent(new ReactTextInputFocusEvent(editText.getId()));
            } else {
              eventDispatcher.dispatchEvent(new ReactTextInputBlurEvent(editText.getId()));

              eventDispatcher.dispatchEvent(
                  new ReactTextInputEndEditingEvent(
                      editText.getId(), editText.getText().toString()));
            }
          }
        });

    editText.setOnEditorActionListener(
        new TextView.OnEditorActionListener() {
          @Override
          public boolean onEditorAction(TextView v, int actionId, KeyEvent keyEvent) {
            if ((actionId & EditorInfo.IME_MASK_ACTION) != 0 || actionId == EditorInfo.IME_NULL) {
              boolean blurOnSubmit = editText.getBlurOnSubmit();
              boolean isMultiline = editText.isMultiline();

              // Motivation:
              // * blurOnSubmit && isMultiline => Clear focus; prevent default behaviour (return
              // true);
              // * blurOnSubmit && !isMultiline => Clear focus; prevent default behaviour (return
              // true);
              // * !blurOnSubmit && isMultiline => Perform default behaviour (return false);
              // * !blurOnSubmit && !isMultiline => Prevent default behaviour (return true).
              // Additionally we always generate a `submit` event.

              EventDispatcher eventDispatcher =
                  reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();

              eventDispatcher.dispatchEvent(
                  new ReactTextInputSubmitEditingEvent(
                      editText.getId(), editText.getText().toString()));

              if (blurOnSubmit) {
                editText.clearFocus();
              }

              // Prevent default behavior except when we want it to insert a newline.
              if (blurOnSubmit || !isMultiline) {
                return true;
              }

              // If we've reached this point, it means that the TextInput has 'blurOnSubmit' set to
              // false and 'multiline' set to true. But it's still possible to get IME_ACTION_NEXT
              // and IME_ACTION_PREVIOUS here in case if 'disableFullscreenUI' is false and Android
              // decides to render this EditText in the full screen mode (when a phone has the
              // landscape orientation for example). The full screen EditText also renders an action
              // button specified by the 'returnKeyType' prop. We have to prevent Android from
              // requesting focus from the next/previous focusable view since it must only be
              // controlled from JS.
              return actionId == EditorInfo.IME_ACTION_NEXT
                  || actionId == EditorInfo.IME_ACTION_PREVIOUS;
            }

            return true;
          }
        });
  }

  private class ReactContentSizeWatcher implements ContentSizeWatcher {
    private ReactEditText mEditText;
    private EventDispatcher mEventDispatcher;
    private int mPreviousContentWidth = 0;
    private int mPreviousContentHeight = 0;

    public ReactContentSizeWatcher(ReactEditText editText) {
      mEditText = editText;
      ReactContext reactContext = (ReactContext) editText.getContext();
      mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
    }

    @Override
    public void onLayout() {
      int contentWidth = mEditText.getWidth();
      int contentHeight = mEditText.getHeight();

      // Use instead size of text content within EditText when available
      if (mEditText.getLayout() != null) {
        contentWidth =
            mEditText.getCompoundPaddingLeft()
                + mEditText.getLayout().getWidth()
                + mEditText.getCompoundPaddingRight();
        contentHeight =
            mEditText.getCompoundPaddingTop()
                + mEditText.getLayout().getHeight()
                + mEditText.getCompoundPaddingBottom();
      }

      if (contentWidth != mPreviousContentWidth || contentHeight != mPreviousContentHeight) {
        mPreviousContentHeight = contentHeight;
        mPreviousContentWidth = contentWidth;

        mEventDispatcher.dispatchEvent(
            new ReactContentSizeChangedEvent(
                mEditText.getId(),
                PixelUtil.toDIPFromPixel(contentWidth),
                PixelUtil.toDIPFromPixel(contentHeight)));
      }
    }
  }

  private class ReactSelectionWatcher implements SelectionWatcher {

    private ReactEditText mReactEditText;
    private EventDispatcher mEventDispatcher;
    private int mPreviousSelectionStart;
    private int mPreviousSelectionEnd;

    public ReactSelectionWatcher(ReactEditText editText) {
      mReactEditText = editText;
      ReactContext reactContext = (ReactContext) editText.getContext();
      mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
    }

    @Override
    public void onSelectionChanged(int start, int end) {
      // Android will call us back for both the SELECTION_START span and SELECTION_END span in text
      // To prevent double calling back into js we cache the result of the previous call and only
      // forward it on if we have new values

      // Apparently Android might call this with an end value that is less than the start value
      // Lets normalize them. See https://github.com/facebook/react-native/issues/18579
      int realStart = Math.min(start, end);
      int realEnd = Math.max(start, end);

      if (mPreviousSelectionStart != realStart || mPreviousSelectionEnd != realEnd) {
        mEventDispatcher.dispatchEvent(
            new ReactTextInputSelectionEvent(mReactEditText.getId(), realStart, realEnd));

        mPreviousSelectionStart = realStart;
        mPreviousSelectionEnd = realEnd;
      }
    }
  }

  private class ReactScrollWatcher implements ScrollWatcher {

    private ReactEditText mReactEditText;
    private EventDispatcher mEventDispatcher;
    private int mPreviousHoriz;
    private int mPreviousVert;

    public ReactScrollWatcher(ReactEditText editText) {
      mReactEditText = editText;
      ReactContext reactContext = (ReactContext) editText.getContext();
      mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
    }

    @Override
    public void onScrollChanged(int horiz, int vert, int oldHoriz, int oldVert) {
      if (mPreviousHoriz != horiz || mPreviousVert != vert) {
        ScrollEvent event =
            ScrollEvent.obtain(
                mReactEditText.getId(),
                ScrollEventType.SCROLL,
                horiz,
                vert,
                0f, // can't get x velocity
                0f, // can't get y velocity
                0, // can't get content width
                0, // can't get content height
                mReactEditText.getWidth(),
                mReactEditText.getHeight());

        mEventDispatcher.dispatchEvent(event);

        mPreviousHoriz = horiz;
        mPreviousVert = vert;
      }
    }
  }

  @Override
  public @Nullable Map getExportedViewConstants() {
    return MapBuilder.of(
        "AutoCapitalizationType",
        MapBuilder.of(
            "none",
            0,
            "characters",
            InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS,
            "words",
            InputType.TYPE_TEXT_FLAG_CAP_WORDS,
            "sentences",
            InputType.TYPE_TEXT_FLAG_CAP_SENTENCES));
  }
}

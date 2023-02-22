/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import static com.facebook.react.uimanager.UIManagerHelper.getReactContext;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.BlendMode;
import android.graphics.BlendModeColorFilter;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.text.Editable;
import android.text.InputFilter;
import android.text.InputType;
import android.text.Layout;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.autofill.HintConstants;
import androidx.core.content.ContextCompat;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.mapbuffer.MapBuffer;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.FabricViewStateManager;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper;
import com.facebook.react.views.scroll.ScrollEvent;
import com.facebook.react.views.scroll.ScrollEventType;
import com.facebook.react.views.text.DefaultStyleValuesUtil;
import com.facebook.react.views.text.ReactBaseTextShadowNode;
import com.facebook.react.views.text.ReactTextUpdate;
import com.facebook.react.views.text.ReactTextViewManagerCallback;
import com.facebook.react.views.text.ReactTypefaceUtils;
import com.facebook.react.views.text.TextAttributeProps;
import com.facebook.react.views.text.TextInlineImageSpan;
import com.facebook.react.views.text.TextLayoutManager;
import com.facebook.react.views.text.TextLayoutManagerMapBuffer;
import com.facebook.react.views.text.TextTransform;
import com.facebook.yoga.YogaConstants;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Locale;
import java.util.Map;

/** Manages instances of TextInput. */
@ReactModule(name = ReactTextInputManager.REACT_CLASS)
public class ReactTextInputManager extends BaseViewManager<ReactEditText, LayoutShadowNode> {
  public static final String TAG = ReactTextInputManager.class.getSimpleName();
  public static final String REACT_CLASS = "AndroidTextInput";

  // See also ReactTextViewManager
  private static final short TX_STATE_KEY_ATTRIBUTED_STRING = 0;
  private static final short TX_STATE_KEY_PARAGRAPH_ATTRIBUTES = 1;
  private static final short TX_STATE_KEY_HASH = 2;
  private static final short TX_STATE_KEY_MOST_RECENT_EVENT_COUNT = 3;

  private static final int[] SPACING_TYPES = {
    Spacing.ALL, Spacing.LEFT, Spacing.RIGHT, Spacing.TOP, Spacing.BOTTOM,
  };
  private static final Map<String, String> REACT_PROPS_AUTOFILL_HINTS_MAP =
      new HashMap<String, String>() {
        {
          put("birthdate-day", HintConstants.AUTOFILL_HINT_BIRTH_DATE_DAY);
          put("birthdate-full", HintConstants.AUTOFILL_HINT_BIRTH_DATE_FULL);
          put("birthdate-month", HintConstants.AUTOFILL_HINT_BIRTH_DATE_MONTH);
          put("birthdate-year", HintConstants.AUTOFILL_HINT_BIRTH_DATE_YEAR);
          put("cc-csc", HintConstants.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE);
          put("cc-exp", HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DATE);
          put("cc-exp-day", HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DAY);
          put("cc-exp-month", HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_MONTH);
          put("cc-exp-year", HintConstants.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_YEAR);
          put("cc-number", HintConstants.AUTOFILL_HINT_CREDIT_CARD_NUMBER);
          put("email", HintConstants.AUTOFILL_HINT_EMAIL_ADDRESS);
          put("gender", HintConstants.AUTOFILL_HINT_GENDER);
          put("name", HintConstants.AUTOFILL_HINT_PERSON_NAME);
          put("name-family", HintConstants.AUTOFILL_HINT_PERSON_NAME_FAMILY);
          put("name-given", HintConstants.AUTOFILL_HINT_PERSON_NAME_GIVEN);
          put("name-middle", HintConstants.AUTOFILL_HINT_PERSON_NAME_MIDDLE);
          put("name-middle-initial", HintConstants.AUTOFILL_HINT_PERSON_NAME_MIDDLE_INITIAL);
          put("name-prefix", HintConstants.AUTOFILL_HINT_PERSON_NAME_PREFIX);
          put("name-suffix", HintConstants.AUTOFILL_HINT_PERSON_NAME_SUFFIX);
          put("password", HintConstants.AUTOFILL_HINT_PASSWORD);
          put("password-new", HintConstants.AUTOFILL_HINT_NEW_PASSWORD);
          put("postal-address", HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS);
          put("postal-address-country", HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_COUNTRY);
          put(
              "postal-address-extended",
              HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_EXTENDED_ADDRESS);
          put(
              "postal-address-extended-postal-code",
              HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_EXTENDED_POSTAL_CODE);
          put("postal-address-locality", HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_LOCALITY);
          put("postal-address-region", HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_REGION);
          put("postal-code", HintConstants.AUTOFILL_HINT_POSTAL_CODE);
          put("street-address", HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_STREET_ADDRESS);
          put("sms-otp", HintConstants.AUTOFILL_HINT_SMS_OTP);
          put("tel", HintConstants.AUTOFILL_HINT_PHONE_NUMBER);
          put("tel-country-code", HintConstants.AUTOFILL_HINT_PHONE_COUNTRY_CODE);
          put("tel-national", HintConstants.AUTOFILL_HINT_PHONE_NATIONAL);
          put("tel-device", HintConstants.AUTOFILL_HINT_PHONE_NUMBER_DEVICE);
          put("username", HintConstants.AUTOFILL_HINT_USERNAME);
          put("username-new", HintConstants.AUTOFILL_HINT_NEW_USERNAME);
        }
      };

  private static final int FOCUS_TEXT_INPUT = 1;
  private static final int BLUR_TEXT_INPUT = 2;
  private static final int SET_MOST_RECENT_EVENT_COUNT = 3;
  private static final int SET_TEXT_AND_SELECTION = 4;

  private static final int INPUT_TYPE_KEYBOARD_NUMBER_PAD = InputType.TYPE_CLASS_NUMBER;
  private static final int INPUT_TYPE_KEYBOARD_DECIMAL_PAD =
      INPUT_TYPE_KEYBOARD_NUMBER_PAD | InputType.TYPE_NUMBER_FLAG_DECIMAL;
  private static final int INPUT_TYPE_KEYBOARD_NUMBERED =
      INPUT_TYPE_KEYBOARD_DECIMAL_PAD | InputType.TYPE_NUMBER_FLAG_SIGNED;
  private static final int PASSWORD_VISIBILITY_FLAG =
      InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD & ~InputType.TYPE_TEXT_VARIATION_PASSWORD;
  private static final int AUTOCAPITALIZE_FLAGS =
      InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
          | InputType.TYPE_TEXT_FLAG_CAP_WORDS
          | InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS;

  private static final String KEYBOARD_TYPE_EMAIL_ADDRESS = "email-address";
  private static final String KEYBOARD_TYPE_NUMERIC = "numeric";
  private static final String KEYBOARD_TYPE_DECIMAL_PAD = "decimal-pad";
  private static final String KEYBOARD_TYPE_NUMBER_PAD = "number-pad";
  private static final String KEYBOARD_TYPE_PHONE_PAD = "phone-pad";
  private static final String KEYBOARD_TYPE_VISIBLE_PASSWORD = "visible-password";
  private static final String KEYBOARD_TYPE_URI = "url";
  private static final InputFilter[] EMPTY_FILTERS = new InputFilter[0];
  private static final int UNSET = -1;
  private static final String[] DRAWABLE_FIELDS = {
    "mCursorDrawable", "mSelectHandleLeft", "mSelectHandleRight", "mSelectHandleCenter"
  };
  private static final String[] DRAWABLE_RESOURCES = {
    "mCursorDrawableRes",
    "mTextSelectHandleLeftRes",
    "mTextSelectHandleRightRes",
    "mTextSelectHandleRes"
  };

  protected @Nullable ReactTextViewManagerCallback mReactTextViewManagerCallback;

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
  public ReactBaseTextShadowNode createShadowNodeInstance() {
    return new ReactTextInputShadowNode();
  }

  public ReactBaseTextShadowNode createShadowNodeInstance(
      @Nullable ReactTextViewManagerCallback reactTextViewManagerCallback) {
    return new ReactTextInputShadowNode(reactTextViewManagerCallback);
  }

  @Override
  public Class<? extends LayoutShadowNode> getShadowNodeClass() {
    return ReactTextInputShadowNode.class;
  }

  @Nullable
  @Override
  public Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
    @Nullable
    Map<String, Object> baseEventTypeConstants =
        super.getExportedCustomBubblingEventTypeConstants();
    Map<String, Object> eventTypeConstants =
        baseEventTypeConstants == null ? new HashMap<String, Object>() : baseEventTypeConstants;
    eventTypeConstants.putAll(
        MapBuilder.<String, Object>builder()
            .put(
                "topSubmitEditing",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of(
                        "bubbled", "onSubmitEditing", "captured", "onSubmitEditingCapture")))
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
            .build());
    return eventTypeConstants;
  }

  @Nullable
  @Override
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    @Nullable
    Map<String, Object> baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants();
    Map<String, Object> eventTypeConstants =
        baseEventTypeConstants == null ? new HashMap<String, Object>() : baseEventTypeConstants;
    eventTypeConstants.putAll(
        MapBuilder.<String, Object>builder()
            .put(
                ScrollEventType.getJSEventName(ScrollEventType.SCROLL),
                MapBuilder.of("registrationName", "onScroll"))
            .build());
    return eventTypeConstants;
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
        this.receiveCommand(reactEditText, "focus", args);
        break;
      case BLUR_TEXT_INPUT:
        this.receiveCommand(reactEditText, "blur", args);
        break;
      case SET_MOST_RECENT_EVENT_COUNT:
        // TODO: delete, this is no longer used from JS
        break;
      case SET_TEXT_AND_SELECTION:
        this.receiveCommand(reactEditText, "setTextAndSelection", args);
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
      case "setTextAndSelection":
        int mostRecentEventCount = args.getInt(0);
        if (mostRecentEventCount == UNSET) {
          return;
        }

        int start = args.getInt(2);
        int end = args.getInt(3);
        if (end == UNSET) {
          end = start;
        }

        if (!args.isNull(1)) {
          String text = args.getString(1);
          reactEditText.maybeSetTextFromJS(
              getReactTextUpdate(text, mostRecentEventCount, start, end));
        }
        reactEditText.maybeSetSelection(mostRecentEventCount, start, end);
        break;
    }
  }

  private ReactTextUpdate getReactTextUpdate(
      String text, int mostRecentEventCount, int start, int end) {
    SpannableStringBuilder sb = new SpannableStringBuilder();
    sb.append(TextTransform.apply(text, TextTransform.UNSET));

    return new ReactTextUpdate(
        sb, mostRecentEventCount, false, 0, 0, 0, 0, Gravity.NO_GRAVITY, 0, 0, start, end);
  }

  @Override
  public void updateExtraData(ReactEditText view, Object extraData) {
    if (extraData instanceof ReactTextUpdate) {
      ReactTextUpdate update = (ReactTextUpdate) extraData;

      // TODO T58784068: delete this block of code, these are always unset in Fabric
      int paddingLeft = (int) update.getPaddingLeft();
      int paddingTop = (int) update.getPaddingTop();
      int paddingRight = (int) update.getPaddingRight();
      int paddingBottom = (int) update.getPaddingBottom();
      if (paddingLeft != UNSET
          || paddingTop != UNSET
          || paddingRight != UNSET
          || paddingBottom != UNSET) {
        view.setPadding(
            paddingLeft != UNSET ? paddingLeft : view.getPaddingLeft(),
            paddingTop != UNSET ? paddingTop : view.getPaddingTop(),
            paddingRight != UNSET ? paddingRight : view.getPaddingRight(),
            paddingBottom != UNSET ? paddingBottom : view.getPaddingBottom());
      }

      if (update.containsImages()) {
        Spannable spannable = update.getText();
        TextInlineImageSpan.possiblyUpdateInlineImageSpans(spannable, view);
      }

      // Ensure that selection is handled correctly on text update
      boolean isCurrentSelectionEmpty = view.getSelectionStart() == view.getSelectionEnd();
      int selectionStart = update.getSelectionStart();
      int selectionEnd = update.getSelectionEnd();
      if ((selectionStart == UNSET || selectionEnd == UNSET) && isCurrentSelectionEmpty) {
        // if selection is not set by state, shift current selection to ensure constant gap to
        // text end
        int textLength = view.getText() == null ? 0 : view.getText().length();
        int selectionOffset = textLength - view.getSelectionStart();
        selectionStart = update.getText().length() - selectionOffset;
        selectionEnd = selectionStart;
      }

      view.maybeSetTextFromState(update);
      view.maybeSetSelection(update.getJsEventCounter(), selectionStart, selectionEnd);
    }
  }

  @ReactProp(name = ViewProps.FONT_SIZE, defaultFloat = ViewDefaults.FONT_SIZE_SP)
  public void setFontSize(ReactEditText view, float fontSize) {
    view.setFontSize(fontSize);
  }

  @ReactProp(name = ViewProps.FONT_FAMILY)
  public void setFontFamily(ReactEditText view, String fontFamily) {
    view.setFontFamily(fontFamily);
  }

  @ReactProp(name = ViewProps.MAX_FONT_SIZE_MULTIPLIER, defaultFloat = Float.NaN)
  public void setMaxFontSizeMultiplier(ReactEditText view, float maxFontSizeMultiplier) {
    view.setMaxFontSizeMultiplier(maxFontSizeMultiplier);
  }

  @ReactProp(name = ViewProps.FONT_WEIGHT)
  public void setFontWeight(ReactEditText view, @Nullable String fontWeight) {
    view.setFontWeight(fontWeight);
  }

  @ReactProp(name = ViewProps.FONT_STYLE)
  public void setFontStyle(ReactEditText view, @Nullable String fontStyle) {
    view.setFontStyle(fontStyle);
  }

  @ReactProp(name = ViewProps.FONT_VARIANT)
  public void setFontVariant(ReactEditText view, @Nullable ReadableArray fontVariant) {
    view.setFontFeatureSettings(ReactTypefaceUtils.parseFontVariant(fontVariant));
  }

  @ReactProp(name = ViewProps.INCLUDE_FONT_PADDING, defaultBoolean = true)
  public void setIncludeFontPadding(ReactEditText view, boolean includepad) {
    view.setIncludeFontPadding(includepad);
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

  @ReactProp(name = "submitBehavior")
  public void setSubmitBehavior(ReactEditText view, @Nullable String submitBehavior) {
    view.setSubmitBehavior(submitBehavior);
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
  public void setPlaceholder(ReactEditText view, String placeholder) {
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
    if (color == null) {
      return;
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      Drawable cursorDrawable = view.getTextCursorDrawable();
      if (cursorDrawable != null) {
        cursorDrawable.setColorFilter(new BlendModeColorFilter(color, BlendMode.SRC_IN));
        view.setTextCursorDrawable(cursorDrawable);
      }
      return;
    }

    if (Build.VERSION.SDK_INT == Build.VERSION_CODES.P) {
      // Pre-Android 10, there was no supported API to change the cursor color programmatically.
      // In Android 9.0, they changed the underlying implementation,
      // but also "dark greylisted" the new field, rendering it unusable.
      return;
    }

    // The evil code that follows uses reflection to achieve this on Android 8.1 and below.
    // Based on https://tinyurl.com/3vff8lyu https://tinyurl.com/vehggzs9
    for (int i = 0; i < DRAWABLE_RESOURCES.length; i++) {
      try {
        Field drawableResourceField = TextView.class.getDeclaredField(DRAWABLE_RESOURCES[i]);
        drawableResourceField.setAccessible(true);
        int resourceId = drawableResourceField.getInt(view);

        // The view has no cursor drawable.
        if (resourceId == 0) {
          return;
        }

        Drawable drawable = ContextCompat.getDrawable(view.getContext(), resourceId);

        Drawable drawableCopy = drawable.mutate();
        drawableCopy.setColorFilter(color, PorterDuff.Mode.SRC_IN);

        Field editorField = TextView.class.getDeclaredField("mEditor");
        editorField.setAccessible(true);
        Object editor = editorField.get(view);

        Field cursorDrawableField = editor.getClass().getDeclaredField(DRAWABLE_FIELDS[i]);
        cursorDrawableField.setAccessible(true);
        if (DRAWABLE_RESOURCES[i] == "mCursorDrawableRes") {
          Drawable[] drawables = {drawableCopy, drawableCopy};
          cursorDrawableField.set(editor, drawables);
        } else {
          cursorDrawableField.set(editor, drawableCopy);
        }
      } catch (NoSuchFieldException ex) {
        // Ignore errors to avoid crashing if these private fields don't exist on modified
        // or future android versions.
      } catch (IllegalAccessException ex) {
      }
    }
  }

  private static boolean shouldHideCursorForEmailTextInput() {
    String manufacturer = Build.MANUFACTURER.toLowerCase(Locale.ROOT);
    return (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q && manufacturer.contains("xiaomi"));
  }

  @ReactProp(name = "caretHidden", defaultBoolean = false)
  public void setCaretHidden(ReactEditText view, boolean caretHidden) {
    if (view.getStagedInputType() == InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
        && shouldHideCursorForEmailTextInput()) {
      return;
    }
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
      ColorStateList defaultContextTextColor =
          DefaultStyleValuesUtil.getDefaultTextColor(view.getContext());

      if (defaultContextTextColor != null) {
        view.setTextColor(defaultContextTextColor);
      } else {
        Context c = view.getContext();
        ReactSoftExceptionLogger.logSoftException(
            TAG,
            new IllegalStateException(
                "Could not get default text color from View Context: "
                    + (c != null ? c.getClass().getCanonicalName() : "null")));
      }
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

    if (background == null) {
      return;
    }

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
      // fixes underlineColor transparent not working on API 21
      // re-sets the TextInput underlineColor https://bit.ly/3M4alr6
      if (Build.VERSION.SDK_INT == Build.VERSION_CODES.LOLLIPOP) {
        int bottomBorderColor = view.getBorderColor(Spacing.BOTTOM);
        setBorderColor(view, Spacing.START, underlineColor);
        drawableToMutate.setColorFilter(underlineColor, PorterDuff.Mode.SRC_IN);
        setBorderColor(view, Spacing.START, bottomBorderColor);
      } else {
        drawableToMutate.setColorFilter(underlineColor, PorterDuff.Mode.SRC_IN);
      }
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

  @ReactProp(name = "autoComplete")
  public void setTextContentType(ReactEditText view, @Nullable String autoComplete) {
    if (autoComplete == null) {
      setImportantForAutofill(view, View.IMPORTANT_FOR_AUTOFILL_NO);
    } else if ("off".equals(autoComplete)) {
      setImportantForAutofill(view, View.IMPORTANT_FOR_AUTOFILL_NO);
    } else if (REACT_PROPS_AUTOFILL_HINTS_MAP.containsKey(autoComplete)) {
      setAutofillHints(view, REACT_PROPS_AUTOFILL_HINTS_MAP.get(autoComplete));
    } else {
      throw new JSApplicationIllegalArgumentException("Invalid autoComplete: " + autoComplete);
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
            ? InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
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

    updateStagedInputTypeFlag(view, AUTOCAPITALIZE_FLAGS, autoCapitalizeValue);
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

      // Set cursor's visibility to False to fix a crash on some Xiaomi devices with Android Q. This
      // crash happens when focusing on a email EditText, during which a prompt will be triggered
      // but
      // the system fail to locate it properly. Here is an example post discussing about this
      // issue: https://github.com/facebook/react-native/issues/27204
      if (shouldHideCursorForEmailTextInput()) {
        view.setCursorVisible(false);
      }
    } else if (KEYBOARD_TYPE_PHONE_PAD.equalsIgnoreCase(keyboardType)) {
      flagsToSet = InputType.TYPE_CLASS_PHONE;
    } else if (KEYBOARD_TYPE_VISIBLE_PASSWORD.equalsIgnoreCase(keyboardType)) {
      // This will supercede secureTextEntry={false}. If it doesn't, due to the way
      //  the flags work out, the underlying field will end up a URI-type field.
      flagsToSet = InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD;
    } else if (KEYBOARD_TYPE_URI.equalsIgnoreCase(keyboardType)) {
      flagsToSet = InputType.TYPE_TEXT_VARIATION_URI;
    }

    updateStagedInputTypeFlag(view, InputType.TYPE_MASK_CLASS, flagsToSet);
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

  @ReactProp(name = "autoFocus", defaultBoolean = false)
  public void setAutoFocus(ReactEditText view, boolean autoFocus) {
    view.setAutoFocus(autoFocus);
  }

  @ReactProp(name = ViewProps.TEXT_DECORATION_LINE)
  public void setTextDecorationLine(ReactEditText view, @Nullable String textDecorationLineString) {
    view.setPaintFlags(
        view.getPaintFlags() & ~(Paint.STRIKE_THRU_TEXT_FLAG | Paint.UNDERLINE_TEXT_FLAG));

    for (String token : textDecorationLineString.split(" ")) {
      if (token.equals("underline")) {
        view.setPaintFlags(view.getPaintFlags() | Paint.UNDERLINE_TEXT_FLAG);
      } else if (token.equals("line-through")) {
        view.setPaintFlags(view.getPaintFlags() | Paint.STRIKE_THRU_TEXT_FLAG);
      }
    }
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
    view.maybeUpdateTypeface();
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

  private static void updateStagedInputTypeFlag(
      ReactEditText view, int flagsToUnset, int flagsToSet) {
    view.setStagedInputType((view.getStagedInputType() & ~flagsToUnset) | flagsToSet);
  }

  private static EventDispatcher getEventDispatcher(
      ReactContext reactContext, ReactEditText editText) {
    return UIManagerHelper.getEventDispatcherForReactTag(reactContext, editText.getId());
  }

  private final class ReactTextInputTextWatcher implements TextWatcher {
    private final ReactEditText mEditText;
    private final EventDispatcher mEventDispatcher;
    private final int mSurfaceId;
    private String mPreviousText;

    public ReactTextInputTextWatcher(
        final ReactContext reactContext, final ReactEditText editText) {
      mEventDispatcher = getEventDispatcher(reactContext, editText);
      mEditText = editText;
      mPreviousText = null;
      mSurfaceId = UIManagerHelper.getSurfaceId(reactContext);
    }

    @Override
    public void beforeTextChanged(CharSequence s, int start, int count, int after) {
      // Incoming charSequence gets mutated before onTextChanged() is invoked
      mPreviousText = s.toString();
    }

    @Override
    public void onTextChanged(CharSequence s, int start, int before, int count) {
      if (mEditText.mDisableTextDiffing) {
        return;
      }

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

      FabricViewStateManager stateManager = mEditText.getFabricViewStateManager();
      if (stateManager.hasStateWrapper()) {
        // Fabric: communicate to C++ layer that text has changed
        // We need to call `incrementAndGetEventCounter` here explicitly because this
        // update may race with other updates.
        // We simply pass in the cache ID, which never changes, but UpdateState will still be called
        // on the native side, triggering a measure.
        stateManager.setState(
            new FabricViewStateManager.StateUpdateCallback() {
              @Override
              public WritableMap getStateUpdate() {
                WritableMap map = new WritableNativeMap();
                map.putInt("mostRecentEventCount", mEditText.incrementAndGetEventCounter());
                map.putInt("opaqueCacheId", mEditText.getId());
                return map;
              }
            });
      }

      // The event that contains the event counter and updates it must be sent first.
      // TODO: t7936714 merge these events
      mEventDispatcher.dispatchEvent(
          new ReactTextChangedEvent(
              mSurfaceId,
              mEditText.getId(),
              s.toString(),
              mEditText.incrementAndGetEventCounter()));

      mEventDispatcher.dispatchEvent(
          new ReactTextInputEvent(
              mSurfaceId, mEditText.getId(), newText, oldText, start, start + before));
    }

    @Override
    public void afterTextChanged(Editable s) {}
  }

  @Override
  protected void addEventEmitters(
      final ThemedReactContext reactContext, final ReactEditText editText) {
    editText.setEventDispatcher(getEventDispatcher(reactContext, editText));
    editText.addTextChangedListener(new ReactTextInputTextWatcher(reactContext, editText));
    editText.setOnFocusChangeListener(
        new View.OnFocusChangeListener() {
          public void onFocusChange(View v, boolean hasFocus) {
            int surfaceId = reactContext.getSurfaceId();
            EventDispatcher eventDispatcher = getEventDispatcher(reactContext, editText);
            if (hasFocus) {
              eventDispatcher.dispatchEvent(
                  new ReactTextInputFocusEvent(surfaceId, editText.getId()));
            } else {
              eventDispatcher.dispatchEvent(
                  new ReactTextInputBlurEvent(surfaceId, editText.getId()));

              eventDispatcher.dispatchEvent(
                  new ReactTextInputEndEditingEvent(
                      surfaceId, editText.getId(), editText.getText().toString()));
            }
          }
        });

    editText.setOnEditorActionListener(
        new TextView.OnEditorActionListener() {
          @Override
          public boolean onEditorAction(TextView v, int actionId, KeyEvent keyEvent) {
            if ((actionId & EditorInfo.IME_MASK_ACTION) != 0 || actionId == EditorInfo.IME_NULL) {
              boolean isMultiline = editText.isMultiline();

              boolean shouldSubmit = editText.shouldSubmitOnReturn();
              boolean shouldBlur = editText.shouldBlurOnReturn();

              // Motivation:
              // * shouldSubmit => Clear focus; prevent default behavior (return true);
              // * shouldBlur => Submit; prevent default behavior (return true);
              // * !shouldBlur && !shouldSubmit && isMultiline => Perform default behavior (return
              // false);
              // * !shouldBlur && !shouldSubmit && !isMultiline => Prevent default behavior (return
              // true);
              if (shouldSubmit) {
                EventDispatcher eventDispatcher = getEventDispatcher(reactContext, editText);
                eventDispatcher.dispatchEvent(
                    new ReactTextInputSubmitEditingEvent(
                        reactContext.getSurfaceId(),
                        editText.getId(),
                        editText.getText().toString()));
              }

              if (shouldBlur) {
                editText.clearFocus();
              }

              // Prevent default behavior except when we want it to insert a newline.
              if (shouldBlur || shouldSubmit || !isMultiline) {
                return true;
              }

              // If we've reached this point, it means that the TextInput has 'submitBehavior' set
              // nullish and 'multiline' set to true. But it's still possible to get IME_ACTION_NEXT
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

  private static class ReactContentSizeWatcher implements ContentSizeWatcher {
    private final ReactEditText mEditText;
    private final EventDispatcher mEventDispatcher;
    private final int mSurfaceId;
    private int mPreviousContentWidth = 0;
    private int mPreviousContentHeight = 0;

    public ReactContentSizeWatcher(ReactEditText editText) {
      mEditText = editText;
      ReactContext reactContext = getReactContext(editText);
      mEventDispatcher = getEventDispatcher(reactContext, editText);
      mSurfaceId = UIManagerHelper.getSurfaceId(reactContext);
    }

    @Override
    public void onLayout() {
      if (mEventDispatcher == null) {
        return;
      }

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
                mSurfaceId,
                mEditText.getId(),
                PixelUtil.toDIPFromPixel(contentWidth),
                PixelUtil.toDIPFromPixel(contentHeight)));
      }
    }
  }

  private static class ReactSelectionWatcher implements SelectionWatcher {
    private final ReactEditText mReactEditText;
    private final EventDispatcher mEventDispatcher;
    private final int mSurfaceId;
    private int mPreviousSelectionStart;
    private int mPreviousSelectionEnd;

    public ReactSelectionWatcher(ReactEditText editText) {
      mReactEditText = editText;
      ReactContext reactContext = getReactContext(editText);
      mEventDispatcher = getEventDispatcher(reactContext, editText);
      mSurfaceId = UIManagerHelper.getSurfaceId(reactContext);
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
            new ReactTextInputSelectionEvent(
                mSurfaceId, mReactEditText.getId(), realStart, realEnd));

        mPreviousSelectionStart = realStart;
        mPreviousSelectionEnd = realEnd;
      }
    }
  }

  private static class ReactScrollWatcher implements ScrollWatcher {
    private final ReactEditText mReactEditText;
    private final EventDispatcher mEventDispatcher;
    private final int mSurfaceId;
    private int mPreviousHoriz;
    private int mPreviousVert;

    public ReactScrollWatcher(ReactEditText editText) {
      mReactEditText = editText;
      ReactContext reactContext = getReactContext(editText);
      mEventDispatcher = getEventDispatcher(reactContext, editText);
      mSurfaceId = UIManagerHelper.getSurfaceId(reactContext);
    }

    @Override
    public void onScrollChanged(int horiz, int vert, int oldHoriz, int oldVert) {
      if (mPreviousHoriz != horiz || mPreviousVert != vert) {
        ScrollEvent event =
            ScrollEvent.obtain(
                mSurfaceId,
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

  @Override
  public void setPadding(ReactEditText view, int left, int top, int right, int bottom) {
    view.setPadding(left, top, right, bottom);
  }

  @Override
  public Object updateState(
      ReactEditText view, ReactStylesDiffMap props, StateWrapper stateWrapper) {
    if (ReactEditText.DEBUG_MODE) {
      FLog.e(TAG, "updateState: [" + view.getId() + "]");
    }

    FabricViewStateManager stateManager = view.getFabricViewStateManager();
    if (!stateManager.hasStateWrapper()) {
      // HACK: In Fabric, we assume all components start off with zero padding, which is
      // not true for TextInput components. We expose the theme's default padding via
      // AndroidTextInputComponentDescriptor, which will be applied later though setPadding.
      // TODO T58784068: move this constructor once Fabric is shipped
      view.setPadding(0, 0, 0, 0);
    }

    stateManager.setStateWrapper(stateWrapper);

    MapBuffer stateMapBuffer = stateWrapper.getStateDataMapBuffer();
    if (stateMapBuffer != null) {
      return getReactTextUpdate(view, props, stateMapBuffer);
    }

    ReadableNativeMap state = stateWrapper.getStateData();
    if (state == null || !state.hasKey("attributedString")) {
      return null;
    }

    ReadableMap attributedString = state.getMap("attributedString");
    ReadableMap paragraphAttributes = state.getMap("paragraphAttributes");
    if (attributedString == null || paragraphAttributes == null) {
      throw new IllegalArgumentException("Invalid TextInput State was received as a parameters");
    }

    Spannable spanned =
        TextLayoutManager.getOrCreateSpannableForText(
            view.getContext(), attributedString, mReactTextViewManagerCallback);

    int textBreakStrategy =
        TextAttributeProps.getTextBreakStrategy(
            paragraphAttributes.getString(ViewProps.TEXT_BREAK_STRATEGY));
    int currentJustificationMode =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O ? 0 : view.getJustificationMode();

    return ReactTextUpdate.buildReactTextUpdateFromState(
        spanned,
        state.getInt("mostRecentEventCount"),
        TextAttributeProps.getTextAlignment(
            props, TextLayoutManager.isRTL(attributedString), view.getGravityHorizontal()),
        textBreakStrategy,
        TextAttributeProps.getJustificationMode(props, currentJustificationMode));
  }

  public Object getReactTextUpdate(ReactEditText view, ReactStylesDiffMap props, MapBuffer state) {
    // If native wants to update the state wrapper but the state data hasn't actually
    // changed, the MapBuffer may be empty
    if (state.getCount() == 0) {
      return null;
    }

    MapBuffer attributedString = state.getMapBuffer(TX_STATE_KEY_ATTRIBUTED_STRING);
    MapBuffer paragraphAttributes = state.getMapBuffer(TX_STATE_KEY_PARAGRAPH_ATTRIBUTES);
    if (attributedString == null || paragraphAttributes == null) {
      throw new IllegalArgumentException(
          "Invalid TextInput State (MapBuffer) was received as a parameters");
    }

    Spannable spanned =
        TextLayoutManagerMapBuffer.getOrCreateSpannableForText(
            view.getContext(), attributedString, mReactTextViewManagerCallback);

    int textBreakStrategy =
        TextAttributeProps.getTextBreakStrategy(
            paragraphAttributes.getString(TextLayoutManagerMapBuffer.PA_KEY_TEXT_BREAK_STRATEGY));
    int currentJustificationMode =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O ? 0 : view.getJustificationMode();

    return ReactTextUpdate.buildReactTextUpdateFromState(
        spanned,
        state.getInt(TX_STATE_KEY_MOST_RECENT_EVENT_COUNT),
        TextAttributeProps.getTextAlignment(
            props, TextLayoutManagerMapBuffer.isRTL(attributedString), view.getGravityHorizontal()),
        textBreakStrategy,
        TextAttributeProps.getJustificationMode(props, currentJustificationMode));
  }
}

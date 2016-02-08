/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.textinput;

import javax.annotation.Nullable;

import java.util.LinkedList;
import java.util.Map;

import android.graphics.PorterDuff;
import android.os.SystemClock;
import android.text.Editable;
import android.text.InputFilter;
import android.text.InputType;
import android.text.Spannable;
import android.text.TextWatcher;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.TextView;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.text.DefaultStyleValuesUtil;
import com.facebook.react.views.text.ReactTextUpdate;
import com.facebook.react.views.text.TextInlineImageSpan;

/**
 * Manages instances of TextInput.
 */
public class ReactTextInputManager extends
    BaseViewManager<ReactEditText, ReactTextInputShadowNode> {

  /* package */ static final String REACT_CLASS = "AndroidTextInput";

  private static final int FOCUS_TEXT_INPUT = 1;
  private static final int BLUR_TEXT_INPUT = 2;

  private static final int INPUT_TYPE_KEYBOARD_NUMBERED =
      InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL |
          InputType.TYPE_NUMBER_FLAG_SIGNED;

  private static final String KEYBOARD_TYPE_EMAIL_ADDRESS = "email-address";
  private static final String KEYBOARD_TYPE_NUMERIC = "numeric";
  private static final String KEYBOARD_TYPE_PHONE_PAD = "phone-pad";
  private static final InputFilter[] EMPTY_FILTERS = new InputFilter[0];

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactEditText createViewInstance(ThemedReactContext context) {
    ReactEditText editText = new ReactEditText(context);
    int inputType = editText.getInputType();
    editText.setInputType(inputType & (~InputType.TYPE_TEXT_FLAG_MULTI_LINE));
    editText.setImeOptions(EditorInfo.IME_ACTION_DONE);
    editText.setTextSize(
        TypedValue.COMPLEX_UNIT_PX,
        (int) Math.ceil(PixelUtil.toPixelFromSP(ViewDefaults.FONT_SIZE_SP)));
    return editText;
  }

  @Override
  public ReactTextInputShadowNode createShadowNodeInstance() {
    return new ReactTextInputShadowNode();
  }

  @Override
  public Class<ReactTextInputShadowNode> getShadowNodeClass() {
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
        .build();
  }

  @Override
  public @Nullable Map<String, Integer> getCommandsMap() {
    return MapBuilder.of("focusTextInput", FOCUS_TEXT_INPUT, "blurTextInput", BLUR_TEXT_INPUT);
  }

  @Override
  public void receiveCommand(
      ReactEditText reactEditText,
      int commandId,
      @Nullable ReadableArray args) {
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
  public void updateExtraData(ReactEditText view, Object extraData) {
    if (extraData instanceof float[]) {
      float[] padding = (float[]) extraData;

      view.setPadding(
          (int) Math.ceil(padding[0]),
          (int) Math.ceil(padding[1]),
          (int) Math.ceil(padding[2]),
          (int) Math.ceil(padding[3]));
    } else if (extraData instanceof ReactTextUpdate) {
      ReactTextUpdate update = (ReactTextUpdate) extraData;
      if (update.containsImages()) {
        Spannable spannable = update.getText();
        TextInlineImageSpan.possiblyUpdateInlineImageSpans(spannable, view);
      }
      view.maybeSetText(update);
    }
  }

  @ReactProp(name = ViewProps.FONT_SIZE, defaultFloat = ViewDefaults.FONT_SIZE_SP)
  public void setFontSize(ReactEditText view, float fontSize) {
    view.setTextSize(
        TypedValue.COMPLEX_UNIT_PX,
        (int) Math.ceil(PixelUtil.toPixelFromSP(fontSize)));
  }

  @ReactProp(name = "onSelectionChange", defaultBoolean = false)
  public void setOnSelectionChange(final ReactEditText view, boolean onSelectionChange) {
    if (onSelectionChange) {
      view.setSelectionWatcher(new ReactSelectionWatcher(view));
    } else {
      view.setSelectionWatcher(null);
    }
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
      view.setHighlightColor(DefaultStyleValuesUtil.getDefaultTextColorHighlight(view.getContext()));
    } else {
      view.setHighlightColor(color);
    }
  }

  @ReactProp(name = "underlineColorAndroid", customType = "Color")
  public void setUnderlineColor(ReactEditText view, @Nullable Integer underlineColor) {
    if (underlineColor == null) {
      view.getBackground().clearColorFilter();
    } else {
      view.getBackground().setColorFilter(underlineColor, PorterDuff.Mode.SRC_IN);
    }
  }

  @ReactProp(name = ViewProps.TEXT_ALIGN)
  public void setTextAlign(ReactEditText view, @Nullable String textAlign) {
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
      throw new JSApplicationIllegalArgumentException("Invalid textAlignVertical: " + textAlignVertical);
    }
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
    InputFilter [] currentFilters = view.getFilters();
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
          newFilters = (InputFilter[]) list.toArray();
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

  @ReactProp(name = "autoCorrect")
  public void setAutoCorrect(ReactEditText view, @Nullable Boolean autoCorrect) {
    // clear auto correct flags, set SUGGESTIONS or NO_SUGGESTIONS depending on value
    updateStagedInputTypeFlag(
        view,
        InputType.TYPE_TEXT_FLAG_AUTO_CORRECT | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS,
        autoCorrect != null ?
            (autoCorrect.booleanValue() ?
                InputType.TYPE_TEXT_FLAG_AUTO_CORRECT : InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS)
            : 0);
  }

  @ReactProp(name = "multiline", defaultBoolean = false)
  public void setMultiline(ReactEditText view, boolean multiline) {
    updateStagedInputTypeFlag(
        view,
        multiline ? 0 : InputType.TYPE_TEXT_FLAG_MULTI_LINE,
        multiline ? InputType.TYPE_TEXT_FLAG_MULTI_LINE : 0);
  }

  @ReactProp(name = "password", defaultBoolean = false)
  public void setPassword(ReactEditText view, boolean password) {
    updateStagedInputTypeFlag(
        view,
        password ? 0 :
            InputType.TYPE_NUMBER_VARIATION_PASSWORD | InputType.TYPE_TEXT_VARIATION_PASSWORD,
        password ? InputType.TYPE_TEXT_VARIATION_PASSWORD : 0);
    checkPasswordType(view);
  }

  @ReactProp(name = "autoCapitalize")
  public void setAutoCapitalize(ReactEditText view, int autoCapitalize) {
    updateStagedInputTypeFlag(
        view,
        InputType.TYPE_TEXT_FLAG_CAP_SENTENCES | InputType.TYPE_TEXT_FLAG_CAP_WORDS |
            InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS,
        autoCapitalize);
  }

  @ReactProp(name = "keyboardType")
  public void setKeyboardType(ReactEditText view, @Nullable String keyboardType) {
    int flagsToSet = InputType.TYPE_CLASS_TEXT;
    if (KEYBOARD_TYPE_NUMERIC.equalsIgnoreCase(keyboardType)) {
      flagsToSet = INPUT_TYPE_KEYBOARD_NUMBERED;
    } else if (KEYBOARD_TYPE_EMAIL_ADDRESS.equalsIgnoreCase(keyboardType)) {
      flagsToSet = InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS | InputType.TYPE_CLASS_TEXT;
    } else if (KEYBOARD_TYPE_PHONE_PAD.equalsIgnoreCase(keyboardType)) {
      flagsToSet = InputType.TYPE_CLASS_PHONE;
    }
    updateStagedInputTypeFlag(
        view,
        INPUT_TYPE_KEYBOARD_NUMBERED | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS |
            InputType.TYPE_CLASS_TEXT,
        flagsToSet);
    checkPasswordType(view);
  }

  @Override
  protected void onAfterUpdateTransaction(ReactEditText view) {
    super.onAfterUpdateTransaction(view);
    view.commitStagedInputType();
  }

  // Sets the correct password type, since numeric and text passwords have different types
  private static void checkPasswordType(ReactEditText view) {
    if ((view.getStagedInputType() & INPUT_TYPE_KEYBOARD_NUMBERED) != 0 &&
        (view.getStagedInputType() & InputType.TYPE_TEXT_VARIATION_PASSWORD) != 0) {
      // Text input type is numbered password, remove text password variation, add numeric one
      updateStagedInputTypeFlag(
          view,
          InputType.TYPE_TEXT_VARIATION_PASSWORD,
          InputType.TYPE_NUMBER_VARIATION_PASSWORD);
    }
  }

  private static void updateStagedInputTypeFlag(
      ReactEditText view,
      int flagsToUnset,
      int flagsToSet) {
    view.setStagedInputType((view.getStagedInputType() & ~flagsToUnset) | flagsToSet);
  }

  private class ReactTextInputTextWatcher implements TextWatcher {

    private EventDispatcher mEventDispatcher;
    private ReactEditText mEditText;
    private String mPreviousText;

    public ReactTextInputTextWatcher(
        final ReactContext reactContext,
        final ReactEditText editText) {
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
      int contentWidth = mEditText.getWidth();
      int contentHeight = mEditText.getHeight();

      // Use instead size of text content within EditText when available
      if (mEditText.getLayout() != null) {
        contentWidth = mEditText.getCompoundPaddingLeft() + mEditText.getLayout().getWidth() +
            mEditText.getCompoundPaddingRight();
        contentHeight = mEditText.getCompoundPaddingTop() + mEditText.getLayout().getHeight() +
            mEditText.getCompoundPaddingTop();
      }

      // The event that contains the event counter and updates it must be sent first.
      // TODO: t7936714 merge these events
      mEventDispatcher.dispatchEvent(
          new ReactTextChangedEvent(
              mEditText.getId(),
              SystemClock.uptimeMillis(),
              s.toString(),
              (int) PixelUtil.toDIPFromPixel(contentWidth),
              (int) PixelUtil.toDIPFromPixel(contentHeight),
              mEditText.incrementAndGetEventCounter()));

      mEventDispatcher.dispatchEvent(
          new ReactTextInputEvent(
              mEditText.getId(),
              SystemClock.uptimeMillis(),
              newText,
              oldText,
              start,
              start + before));
    }

    @Override
    public void afterTextChanged(Editable s) {
    }
  }

  @Override
  protected void addEventEmitters(
      final ThemedReactContext reactContext,
      final ReactEditText editText) {
    editText.addTextChangedListener(new ReactTextInputTextWatcher(reactContext, editText));
    editText.setOnFocusChangeListener(
        new View.OnFocusChangeListener() {
          public void onFocusChange(View v, boolean hasFocus) {
            EventDispatcher eventDispatcher =
                reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
            if (hasFocus) {
              eventDispatcher.dispatchEvent(
                  new ReactTextInputFocusEvent(
                      editText.getId(),
                      SystemClock.uptimeMillis()));
            } else {
              eventDispatcher.dispatchEvent(
                  new ReactTextInputBlurEvent(
                      editText.getId(),
                      SystemClock.uptimeMillis()));

              eventDispatcher.dispatchEvent(
                  new ReactTextInputEndEditingEvent(
                      editText.getId(),
                      SystemClock.uptimeMillis(),
                      editText.getText().toString()));
            }
          }
        });

    editText.setOnEditorActionListener(
        new TextView.OnEditorActionListener() {
          @Override
          public boolean onEditorAction(TextView v, int actionId, KeyEvent keyEvent) {
            // Any 'Enter' action will do
            if ((actionId & EditorInfo.IME_MASK_ACTION) > 0 ||
                actionId == EditorInfo.IME_NULL) {
              EventDispatcher eventDispatcher =
                  reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
              eventDispatcher.dispatchEvent(
                  new ReactTextInputSubmitEditingEvent(
                      editText.getId(),
                      SystemClock.uptimeMillis(),
                      editText.getText().toString()));
            }
            return false;
          }
        });
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
      if (mPreviousSelectionStart != start || mPreviousSelectionEnd != end) {
        mEventDispatcher.dispatchEvent(
            new ReactTextInputSelectionEvent(
                mReactEditText.getId(),
                SystemClock.uptimeMillis(),
                start,
                end
            )
        );

        mPreviousSelectionStart = start;
        mPreviousSelectionEnd = end;
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

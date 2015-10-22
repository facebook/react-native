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

import java.util.Map;

import android.graphics.PorterDuff;
import android.os.SystemClock;
import android.text.Editable;
import android.text.InputType;
import android.text.TextWatcher;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.TextView;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.JSApplicationCausedNativeException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.UIProp;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.text.DefaultStyleValuesUtil;

/**
 * Manages instances of TextInput.
 */
public class ReactTextInputManager extends
    BaseViewManager<ReactEditText, ReactTextInputShadowNode> {

  /* package */ static final String REACT_CLASS = "AndroidTextInput";

  private static final int FOCUS_TEXT_INPUT = 1;
  private static final int BLUR_TEXT_INPUT = 2;

  private static final String KEYBOARD_TYPE_EMAIL_ADDRESS = "email-address";
  private static final String KEYBOARD_TYPE_NUMERIC = "numeric";

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
      view.maybeSetText((ReactTextUpdate) extraData);
    }
  }

  @ReactProp(name = ViewProps.FONT_SIZE, defaultFloat = ViewDefaults.FONT_SIZE_SP)
  public void setFontSize(ReactEditText view, float fontSize) {
    view.setTextSize(
        TypedValue.COMPLEX_UNIT_PX,
        (int) Math.ceil(PixelUtil.toPixelFromSP(fontSize)));
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

  @ReactProp(name = "underlineColorAndroid", customType = "Color")
  public void setUnderlineColor(ReactEditText view, @Nullable Integer underlineColor) {
    if (underlineColor == null) {
      view.getBackground().clearColorFilter();
    } else {
      view.getBackground().setColorFilter(underlineColor, PorterDuff.Mode.SRC_IN);
    }
  }

  @ReactProp(name = "textAlign")
  public void setTextAlign(ReactEditText view, int gravity) {
    view.setGravityHorizontal(gravity);
  }

  @ReactProp(name = "textAlignVertical")
  public void setTextAlignVertical(ReactEditText view, int gravity) {
    view.setGravityVertical(gravity);
  }

  @ReactProp(name = "editable", defaultBoolean = true)
  public void setEditable(ReactEditText view, boolean editable) {
    view.setEnabled(editable);
  }

  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = 1)
  public void setNumLines(ReactEditText view, int numLines) {
    view.setLines(numLines);
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
        password ? 0 : InputType.TYPE_TEXT_VARIATION_PASSWORD,
        password ? InputType.TYPE_TEXT_VARIATION_PASSWORD : 0);
  }

  @ReactProp(name = "autoCapitalize", defaultInt = InputType.TYPE_CLASS_TEXT)
  public void setAutoCapitalize(ReactEditText view, int autoCapitalize) {
    int flagsToSet = 0;
    switch (autoCapitalize) {
      case InputType.TYPE_TEXT_FLAG_CAP_SENTENCES:
      case InputType.TYPE_TEXT_FLAG_CAP_WORDS:
      case InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS:
      case InputType.TYPE_CLASS_TEXT:
        flagsToSet = autoCapitalize;
        break;
      default:
        throw new
            JSApplicationCausedNativeException("Invalid autoCapitalize value: " + autoCapitalize);
    }
    updateStagedInputTypeFlag(
        view,
        InputType.TYPE_TEXT_FLAG_CAP_SENTENCES | InputType.TYPE_TEXT_FLAG_CAP_WORDS |
            InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS,
        flagsToSet);
  }

  @ReactProp(name = "keyboardType")
  public void setKeyboardType(ReactEditText view, @Nullable String keyboardType) {
    int flagsToSet = 0;
    if (KEYBOARD_TYPE_NUMERIC.equalsIgnoreCase(keyboardType)) {
      flagsToSet = InputType.TYPE_CLASS_NUMBER;
    } else if (KEYBOARD_TYPE_EMAIL_ADDRESS.equalsIgnoreCase(keyboardType)) {
      flagsToSet = InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS;
    }
    updateStagedInputTypeFlag(
        view,
        InputType.TYPE_CLASS_NUMBER | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS,
        flagsToSet);
  }

  @Override
  protected void onAfterUpdateTransaction(ReactEditText view) {
    super.onAfterUpdateTransaction(view);
    view.commitStagedInputType();
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
      if (count > 0 || before > 0) {
        Assertions.assertNotNull(mPreviousText);

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
                count > 0 ? s.toString().substring(start, start + count) : "",
                before > 0 ? mPreviousText.substring(start, start + before) : "",
                start,
                count > 0 ? start + count - 1 : start + before));
      }
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

  @Override
  public @Nullable Map getExportedViewConstants() {
    return MapBuilder.of(
        "TextAlign",
        MapBuilder.of(
            "start", Gravity.START,
            "center", Gravity.CENTER_HORIZONTAL,
            "end", Gravity.END),
        "TextAlignVertical",
        MapBuilder.of(
            "top", Gravity.TOP,
            "center", Gravity.CENTER_VERTICAL,
            "bottom", Gravity.BOTTOM));
  }
}

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

import android.graphics.Color;
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
import com.facebook.react.uimanager.BaseViewPropertyApplicator;
import com.facebook.react.uimanager.CatalystStylesDiffMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.UIProp;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.text.DefaultStyleValuesUtil;

/**
 * Manages instances of TextInput.
 */
public class ReactTextInputManager extends ViewManager<ReactEditText, ReactTextInputShadowNode> {

  /* package */ static final String REACT_CLASS = "AndroidTextInput";

  private static final int FOCUS_TEXT_INPUT = 1;
  private static final int BLUR_TEXT_INPUT = 2;

  @UIProp(UIProp.Type.STRING)
  public static final String PROP_TEXT_INPUT_TEXT = "text";
  @UIProp(UIProp.Type.NUMBER)
  public static final String PROP_TEXT_INPUT_MOST_RECENT_EVENT_COUNT = "mostRecentEventCount";
  @UIProp(UIProp.Type.NUMBER)
  public static final String PROP_FONT_SIZE = ViewProps.FONT_SIZE;
  @UIProp(UIProp.Type.BOOLEAN)
  public static final String PROP_TEXT_INPUT_AUTO_CORRECT = "autoCorrect";
  @UIProp(UIProp.Type.NUMBER)
  public static final String PROP_TEXT_INPUT_AUTO_CAPITALIZE = "autoCapitalize";
  @UIProp(UIProp.Type.NUMBER)
  public static final String PROP_TEXT_ALIGN = "textAlign";
  @UIProp(UIProp.Type.NUMBER)
  public static final String PROP_TEXT_ALIGN_VERTICAL = "textAlignVertical";
  @UIProp(UIProp.Type.STRING)
  public static final String PROP_TEXT_INPUT_HINT = "placeholder";
  @UIProp(UIProp.Type.COLOR)
  public static final String PROP_TEXT_INPUT_HINT_COLOR = "placeholderTextColor";
  @UIProp(UIProp.Type.NUMBER)
  public static final String PROP_TEXT_INPUT_NUMLINES = ViewProps.NUMBER_OF_LINES;
  @UIProp(UIProp.Type.BOOLEAN)
  public static final String PROP_TEXT_INPUT_MULTILINE = "multiline";
  @UIProp(UIProp.Type.STRING)
  public static final String PROP_TEXT_INPUT_KEYBOARD_TYPE = "keyboardType";
  @UIProp(UIProp.Type.BOOLEAN)
  public static final String PROP_TEXT_INPUT_PASSWORD = "password";
  @UIProp(UIProp.Type.BOOLEAN)
  public static final String PROP_TEXT_INPUT_EDITABLE = "editable";
  @UIProp(UIProp.Type.COLOR)
  public static final String PROP_TEXT_INPUT_UNDERLINE_COLOR = "underlineColorAndroid";
  @UIProp(UIProp.Type.NUMBER)
  public static final String PROP_TEST_ID = "testID";

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
  public ReactTextInputShadowNode createCSSNodeInstance() {
    return new ReactTextInputShadowNode();
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

  @Override
  public void updateView(ReactEditText view, CatalystStylesDiffMap props) {
    BaseViewPropertyApplicator.applyCommonViewProperties(view, props);

    if (props.hasKey(PROP_FONT_SIZE)) {
      float textSize = props.getFloat(PROP_FONT_SIZE, ViewDefaults.FONT_SIZE_SP);
      view.setTextSize(
          TypedValue.COMPLEX_UNIT_PX,
          (int) Math.ceil(PixelUtil.toPixelFromSP(textSize)));
    }

    //Prevents flickering color while waiting for JS update.
    if (props.hasKey(ViewProps.COLOR)) {
      if (props.isNull(ViewProps.COLOR)) {
        view.setTextColor(DefaultStyleValuesUtil.getDefaultTextColor(view.getContext()));
      } else {
        final int textColor = props.getColorInt(ViewProps.COLOR, Color.TRANSPARENT);
        view.setTextColor(textColor);
      }
    }

    if (props.hasKey(PROP_TEXT_INPUT_HINT)) {
      view.setHint(props.getString(PROP_TEXT_INPUT_HINT));
    }

    if (props.hasKey(PROP_TEXT_INPUT_HINT_COLOR)) {
      if (props.isNull(PROP_TEXT_INPUT_HINT_COLOR)) {
        view.setHintTextColor(DefaultStyleValuesUtil.getDefaultTextColorHint(view.getContext()));
      } else {
        final int hintColor = props.getColorInt(PROP_TEXT_INPUT_HINT_COLOR, Color.TRANSPARENT);
        view.setHintTextColor(hintColor);
      }
    }

    if (props.hasKey(PROP_TEXT_INPUT_UNDERLINE_COLOR)) {
      if (props.isNull(PROP_TEXT_INPUT_UNDERLINE_COLOR)) {
        view.getBackground().clearColorFilter();
      } else {
        final int underlineColor =
            props.getColorInt(PROP_TEXT_INPUT_UNDERLINE_COLOR, Color.TRANSPARENT);
        view.getBackground().setColorFilter(underlineColor, PorterDuff.Mode.SRC_IN);
      }
    }

    if (props.hasKey(PROP_TEXT_ALIGN)) {
      int gravityHorizontal = props.getInt(PROP_TEXT_ALIGN, 0);
      view.setGravityHorizontal(gravityHorizontal);
    }

    if (props.hasKey(PROP_TEXT_ALIGN_VERTICAL)) {
      int gravityVertical = props.getInt(PROP_TEXT_ALIGN_VERTICAL, 0);
      view.setGravityVertical(gravityVertical);
    }

    if (props.hasKey(PROP_TEXT_INPUT_EDITABLE)) {
      if (props.getBoolean(PROP_TEXT_INPUT_EDITABLE, true)) {
        view.setEnabled(true);
      } else {
        view.setEnabled(false);
      }
    }

    // newInputType will collect all content attributes that have to be set in the InputText.
    int newInputType = view.getInputType();

    if (props.hasKey(PROP_TEXT_INPUT_AUTO_CORRECT)) {
      // clear auto correct flags
      newInputType
          &= ~(InputType.TYPE_TEXT_FLAG_AUTO_CORRECT | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
      if (props.getBoolean(PROP_TEXT_INPUT_AUTO_CORRECT, false)) {
        newInputType |= InputType.TYPE_TEXT_FLAG_AUTO_CORRECT;
      } else if (!props.isNull(PROP_TEXT_INPUT_AUTO_CORRECT)) {
        newInputType |= InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS;
      }
    }

    if (props.hasKey(PROP_TEXT_INPUT_MULTILINE)) {
      if (props.getBoolean(PROP_TEXT_INPUT_MULTILINE, false)) {
        newInputType |= InputType.TYPE_TEXT_FLAG_MULTI_LINE;
      } else {
        newInputType &= ~InputType.TYPE_TEXT_FLAG_MULTI_LINE;
      }
    }

    if (props.hasKey(PROP_TEXT_INPUT_KEYBOARD_TYPE)) {
      // reset keyboard type defaults
      newInputType = newInputType &
          ~InputType.TYPE_CLASS_NUMBER &
          ~InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS;

      String keyboardType = props.getString(PROP_TEXT_INPUT_KEYBOARD_TYPE);
      if (KEYBOARD_TYPE_NUMERIC.equalsIgnoreCase(keyboardType)) {
        newInputType |= InputType.TYPE_CLASS_NUMBER;
      } else if (KEYBOARD_TYPE_EMAIL_ADDRESS.equalsIgnoreCase(keyboardType)) {
        newInputType |= InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS;
      }
    }

    if (props.hasKey(PROP_TEXT_INPUT_PASSWORD)) {
      if (props.getBoolean(PROP_TEXT_INPUT_PASSWORD, false)) {
        newInputType |= InputType.TYPE_TEXT_VARIATION_PASSWORD;
      } else {
        newInputType &= ~InputType.TYPE_TEXT_VARIATION_PASSWORD;
      }
    }

    if (props.hasKey(PROP_TEXT_INPUT_AUTO_CAPITALIZE)) {
      // clear auto capitalization flags
      newInputType &= ~(
          InputType.TYPE_TEXT_FLAG_CAP_SENTENCES |
              InputType.TYPE_TEXT_FLAG_CAP_WORDS |
              InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS);
      int autoCapitalize = props.getInt(PROP_TEXT_INPUT_AUTO_CAPITALIZE, InputType.TYPE_CLASS_TEXT);

      switch (autoCapitalize) {
        case InputType.TYPE_TEXT_FLAG_CAP_SENTENCES:
        case InputType.TYPE_TEXT_FLAG_CAP_WORDS:
        case InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS:
        case InputType.TYPE_CLASS_TEXT:
          newInputType |= autoCapitalize;
          break;
        default:
          throw new
              JSApplicationCausedNativeException("Invalid autoCapitalize value: " + autoCapitalize);
      }
    }

    if (view.getInputType() != newInputType) {
      view.setInputType(newInputType);
    }

    if (props.hasKey(PROP_TEXT_INPUT_NUMLINES)) {
      view.setLines(props.getInt(PROP_TEXT_INPUT_NUMLINES, 1));
    }
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

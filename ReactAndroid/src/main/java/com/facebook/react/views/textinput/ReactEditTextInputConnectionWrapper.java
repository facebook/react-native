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

import android.view.KeyEvent;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputConnectionWrapper;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;

/**
 * A class to implement the TextInput 'onKeyPress' API on android for soft keyboards.
 * It is instantiated in {@link ReactEditText#onCreateInputConnection(EditorInfo)}.
 *
 * Android IMEs interface with EditText views through the {@link InputConnection} interface,
 * so any observable change in state of the EditText via the soft-keyboard, should be a side effect of
 * one or more of the methods in {@link InputConnectionWrapper}.
 *
 * {@link InputConnection#setComposingText(CharSequence, int)} is used to set the composing region
 * (the underlined text) in the {@link android.widget.EditText} view, i.e. when React Native's
 * TextInput has the property 'autoCorrect' set to true. When text is being composed in the composing
 * state within the EditText, each key press will result in a call to
 * {@link InputConnection#setComposingText(CharSequence, int)} with a CharSequence argument equal to
 * that of the entire composing region, rather than a single character diff.
 * We can reason about the keyPress based on the resultant cursor position changes of the EditText after
 * applying this change. For example if the cursor moved backwards by one character when composing,
 * it's likely it was a delete; if it moves forward by a character, likely to be a key press of that character.
 *
 * IMEs can also call {@link InputConnection#beginBatchEdit()} to signify a batch of operations. One
 * such example is committing a word currently in composing state with the press of the space key.
 * It is IME dependent but the stock Android keyboard behavior seems to be to commit the currently composing
 * text with {@link InputConnection#setComposingText(CharSequence, int)} and commits a space character
 * with a separate call to {@link InputConnection#setComposingText(CharSequence, int)}.
 * Here we chose to emit the last input of a batch edit as that tends to be the user input, but
 * it's completely arbitrary.
 *
 * Another function of this class is to detect backspaces when the cursor at the beginning of the
 * {@link android.widget.EditText}, i.e no text is deleted.
 *
 * N.B. this class is only applicable for soft keyboards behavior. For hardware keyboards
 * {@link android.view.View#onKeyDown(int, KeyEvent)} can be overridden to obtain the keycode of the
 * key pressed.
 */
class ReactEditTextInputConnectionWrapper extends InputConnectionWrapper {
  public static final String NEWLINE_RAW_VALUE = "\n";
  public static final String BACKSPACE_KEY_VALUE = "Backspace";
  public static final String ENTER_KEY_VALUE = "Enter";

  private ReactEditText mEditText;
  private EventDispatcher mEventDispatcher;
  private boolean mIsBatchEdit;
  private @Nullable String mKey = null;

  public ReactEditTextInputConnectionWrapper(
      InputConnection target,
      final ReactContext reactContext,
      final ReactEditText editText
  ) {
    super(target, false);
    mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
    mEditText = editText;
  }

  @Override
  public boolean beginBatchEdit() {
    mIsBatchEdit = true;
    return super.beginBatchEdit();
  }

  @Override
  public boolean endBatchEdit() {
    mIsBatchEdit = false;
    if (mKey != null) {
      dispatchKeyEvent(mKey);
      mKey = null;
    }
    return super.endBatchEdit();
  }

  @Override
  public boolean setComposingText(CharSequence text, int newCursorPosition) {
    int previousSelectionStart = mEditText.getSelectionStart();
    int previousSelectionEnd = mEditText.getSelectionEnd();
    String key;
    boolean consumed = super.setComposingText(text, newCursorPosition);
    boolean noPreviousSelection = previousSelectionStart == previousSelectionEnd;
    boolean cursorDidNotMove = mEditText.getSelectionStart() == previousSelectionStart;
    boolean cursorMovedBackwards = mEditText.getSelectionStart() < previousSelectionStart;
    if ((noPreviousSelection && cursorMovedBackwards)
            || !noPreviousSelection && cursorDidNotMove) {
      key = BACKSPACE_KEY_VALUE;
    } else {
      key = String.valueOf(mEditText.getText().charAt(mEditText.getSelectionStart() - 1));
    }
    dispatchKeyEventOrEnqueue(key);
    return consumed;
  }

  @Override
  public boolean commitText(CharSequence text, int newCursorPosition) {
    String key = text.toString();
    // Assume not a keyPress if length > 1
    if (key.length() <= 1) {
      if (key.equals("")) {
        key = BACKSPACE_KEY_VALUE;
      }
      dispatchKeyEventOrEnqueue(key);
    }

    return super.commitText(text, newCursorPosition);
  }

  @Override
  public boolean deleteSurroundingText(int beforeLength, int afterLength) {
    dispatchKeyEvent(BACKSPACE_KEY_VALUE);
    return super.deleteSurroundingText(beforeLength, afterLength);
  }

  // Called by SwiftKey when cursor at beginning of input when there is a delete
  // or when enter is pressed anywhere in the text. Whereas stock Android Keyboard calls
  // {@link InputConnection#deleteSurroundingText} & {@link InputConnection#commitText}
  // in each case, respectively.
  @Override
  public boolean sendKeyEvent(KeyEvent event) {
    if(event.getAction() == KeyEvent.ACTION_DOWN) {
      if (event.getKeyCode() == KeyEvent.KEYCODE_DEL) {
        dispatchKeyEvent(BACKSPACE_KEY_VALUE);
      } else if(event.getKeyCode() == KeyEvent.KEYCODE_ENTER) {
        dispatchKeyEvent(ENTER_KEY_VALUE);
      }
    }
    return super.sendKeyEvent(event);
  }

  private void dispatchKeyEventOrEnqueue(String key) {
    if (mIsBatchEdit) {
      mKey = key;
    } else {
      dispatchKeyEvent(key);
    }
  }

  private void dispatchKeyEvent(String key) {
    if (key.equals(NEWLINE_RAW_VALUE)) {
      key = ENTER_KEY_VALUE;
    }
    mEventDispatcher.dispatchEvent(
        new ReactTextInputKeyPressEvent(
            mEditText.getId(),
            key));
  }
}

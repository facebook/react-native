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
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputConnectionWrapper;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;


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
      boolean mutable,
      final ReactContext reactContext,
      final ReactEditText editText
  ) {
    super(target, mutable);
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
    if(mKey != null) {
      dispatchKeyEvent(mKey);
      mKey = null;
    }
    return super.endBatchEdit();
  }

  @Override
  public boolean setComposingText(CharSequence text, int newCursorPosition) {
    final int previousSelectionStart = mEditText.getSelectionStart();
    final int previousSelectionEnd = mEditText.getSelectionEnd();
    String key;
    final boolean consumed = super.setComposingText(text, newCursorPosition);
    final boolean noPreviousSelection = previousSelectionStart == previousSelectionEnd;
    if ((noPreviousSelection && mEditText.getSelectionStart() < previousSelectionStart)
            || !noPreviousSelection && mEditText.getSelectionStart() == previousSelectionStart) {
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
  // or when enter is pressed. Whereas stock Android Keyboard calls
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
    if(mIsBatchEdit) {
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

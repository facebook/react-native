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

import java.util.ArrayList;

import android.content.Context;
import android.graphics.Rect;
import android.text.Editable;
import android.text.InputType;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;

import com.facebook.infer.annotation.Assertions;

/**
 * A wrapper around the EditText that lets us better control what happens when an EditText gets
 * focused or blurred, and when to display the soft keyboard and when not to.
 *
 * ReactEditTexts have setFocusableInTouchMode set to false automatically because touches on the
 * EditText are managed on the JS side. This also removes the nasty side effect that EditTexts
 * have, which is that focus is always maintained on one of the EditTexts.
 *
 * The wrapper stops the EditText from triggering *TextChanged events, in the case where JS
 * has called this explicitly. This is the default behavior on other platforms as well.
 * VisibleForTesting from {@link TextInputEventsTestCase}.
 */
public class ReactEditText extends EditText {

  private final InputMethodManager mInputMethodManager;
  // This flag is set to true when we set the text of the EditText explicitly. In that case, no
  // *TextChanged events should be triggered. This is less expensive than removing the text
  // listeners and adding them back again after the text change is completed.
  private boolean mIsSettingTextFromJS;
  // This component is controlled, so we want it to get focused only when JS ask it to do so.
  // Whenever android requests focus (which it does for random reasons), it will be ignored.
  private boolean mIsJSSettingFocus;
  private int mDefaultGravityHorizontal;
  private int mDefaultGravityVertical;
  private int mNativeEventCount;
  private @Nullable ArrayList<TextWatcher> mListeners;
  private @Nullable TextWatcherDelegator mTextWatcherDelegator;
  private int mStagedInputType;

  public ReactEditText(Context context) {
    super(context);
    setFocusableInTouchMode(false);

    mInputMethodManager = (InputMethodManager)
        Assertions.assertNotNull(getContext().getSystemService(Context.INPUT_METHOD_SERVICE));
    mDefaultGravityHorizontal =
        getGravity() & (Gravity.HORIZONTAL_GRAVITY_MASK | Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK);
    mDefaultGravityVertical = getGravity() & Gravity.VERTICAL_GRAVITY_MASK;
    mNativeEventCount = 0;
    mIsSettingTextFromJS = false;
    mIsJSSettingFocus = false;
    mListeners = null;
    mTextWatcherDelegator = null;
    mStagedInputType = getInputType();
  }

  // After the text changes inside an EditText, TextView checks if a layout() has been requested.
  // If it has, it will not scroll the text to the end of the new text inserted, but wait for the
  // next layout() to be called. However, we do not perform a layout() after a requestLayout(), so
  // we need to override isLayoutRequested to force EditText to scroll to the end of the new text
  // immediately.
  // TODO: t6408636 verify if we should schedule a layout after a View does a requestLayout()
  @Override
  public boolean isLayoutRequested() {
    return false;
  }

  // Consume 'Enter' key events: TextView tries to give focus to the next TextInput, but it can't
  // since we only allow JS to change focus, which in turn causes TextView to crash.
  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_ENTER &&
        ((getInputType() & InputType.TYPE_TEXT_FLAG_MULTI_LINE) == 0 )) {
      hideSoftKeyboard();
      return true;
    }
    return super.onKeyUp(keyCode, event);
  }

  @Override
  public void clearFocus() {
    setFocusableInTouchMode(false);
    super.clearFocus();
    hideSoftKeyboard();
  }

  @Override
  public boolean requestFocus(int direction, Rect previouslyFocusedRect) {
    // Always return true if we are already focused. This is used by android in certain places,
    // such as text selection.
    if (isFocused()) {
      return true;
    }
    if (!mIsJSSettingFocus) {
      return false;
    }
    setFocusableInTouchMode(true);
    boolean focused = super.requestFocus(direction, previouslyFocusedRect);
    showSoftKeyboard();
    return focused;
  }

  @Override
  public void addTextChangedListener(TextWatcher watcher) {
    if (mListeners == null) {
      mListeners = new ArrayList<>();
      super.addTextChangedListener(getTextWatcherDelegator());
    }

    mListeners.add(watcher);
  }

  @Override
  public void removeTextChangedListener(TextWatcher watcher) {
    if (mListeners != null) {
      mListeners.remove(watcher);

      if (mListeners.isEmpty()) {
        mListeners = null;
        super.removeTextChangedListener(getTextWatcherDelegator());
      }
    }
  }

  /*protected*/ int getStagedInputType() {
    return mStagedInputType;
  }

  /*package*/ void setStagedInputType(int stagedInputType) {
    mStagedInputType = stagedInputType;
  }

  /*package*/ void commitStagedInputType() {
    if (getInputType() != mStagedInputType) {
      setInputType(mStagedInputType);
    }
  }

  @Override
  public void setInputType(int type) {
    super.setInputType(type);
    mStagedInputType = type;
  }

  /* package */ void requestFocusFromJS() {
    mIsJSSettingFocus = true;
    requestFocus();
    mIsJSSettingFocus = false;
  }

  /* package */ void clearFocusFromJS() {
    clearFocus();
  }

  // VisibleForTesting from {@link TextInputEventsTestCase}.
  public int incrementAndGetEventCounter() {
    return ++mNativeEventCount;
  }

  // VisibleForTesting from {@link TextInputEventsTestCase}.
  public void maybeSetText(ReactTextUpdate reactTextUpdate) {
    // Only set the text if it is up to date.
    if (reactTextUpdate.getJsEventCounter() < mNativeEventCount) {
      return;
    }

    // The current text gets replaced with the text received from JS. However, the spans on the
    // current text need to be adapted to the new text. Since TextView#setText() will remove or
    // reset some of these spans even if they are set directly, SpannableStringBuilder#replace() is
    // used instead (this is also used by the the keyboard implementation underneath the covers).
    SpannableStringBuilder spannableStringBuilder =
        new SpannableStringBuilder(reactTextUpdate.getText());
    manageSpans(spannableStringBuilder);
    mIsSettingTextFromJS = true;
    getText().replace(0, length(), spannableStringBuilder);
    mIsSettingTextFromJS = false;
  }

  /**
   * Remove and/or add {@link Spanned.SPAN_EXCLUSIVE_EXCLUSIVE} spans, since they should only exist
   * as long as the text they cover is the same. All other spans will remain the same, since they
   * will adapt to the new text, hence why {@link SpannableStringBuilder#replace} never removes
   * them.
   */
  private void manageSpans(SpannableStringBuilder spannableStringBuilder) {
    Object[] spans = getText().getSpans(0, length(), Object.class);
    for (int spanIdx = 0; spanIdx < spans.length; spanIdx++) {
      if ((getText().getSpanFlags(spans[spanIdx]) & Spanned.SPAN_EXCLUSIVE_EXCLUSIVE) !=
          Spanned.SPAN_EXCLUSIVE_EXCLUSIVE) {
        continue;
      }
      Object span = spans[spanIdx];
      final int spanStart = getText().getSpanStart(spans[spanIdx]);
      final int spanEnd = getText().getSpanEnd(spans[spanIdx]);
      final int spanFlags = getText().getSpanFlags(spans[spanIdx]);

      // Make sure the span is removed from existing text, otherwise the spans we set will be
      // ignored or it will cover text that has changed.
      getText().removeSpan(spans[spanIdx]);
      if (sameTextForSpan(getText(), spannableStringBuilder, spanStart, spanEnd)) {
        spannableStringBuilder.setSpan(span, spanStart, spanEnd, spanFlags);
      }
    }
  }

  private static boolean sameTextForSpan(
      final Editable oldText,
      final SpannableStringBuilder newText,
      final int start,
      final int end) {
    if (start > newText.length() || end > newText.length()) {
      return false;
    }
    for (int charIdx = start; charIdx < end; charIdx++) {
      if (oldText.charAt(charIdx) != newText.charAt(charIdx)) {
        return false;
      }
    }
    return true;
  }

  private boolean showSoftKeyboard() {
    return mInputMethodManager.showSoftInput(this, 0);
  }

  private void hideSoftKeyboard() {
    mInputMethodManager.hideSoftInputFromWindow(getWindowToken(), 0);
  }

  private TextWatcherDelegator getTextWatcherDelegator() {
    if (mTextWatcherDelegator == null) {
      mTextWatcherDelegator = new TextWatcherDelegator();
    }
    return mTextWatcherDelegator;
  }

  /* package */ void setGravityHorizontal(int gravityHorizontal) {
    if (gravityHorizontal == 0) {
      gravityHorizontal = mDefaultGravityHorizontal;
    }
    setGravity(
        (getGravity() & ~Gravity.HORIZONTAL_GRAVITY_MASK &
            ~Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK) | gravityHorizontal);
  }

  /* package */ void setGravityVertical(int gravityVertical) {
    if (gravityVertical == 0) {
      gravityVertical = mDefaultGravityVertical;
    }
    setGravity((getGravity() & ~Gravity.VERTICAL_GRAVITY_MASK) | gravityVertical);
  }

  /**
   * This class will redirect *TextChanged calls to the listeners only in the case where the text
   * is changed by the user, and not explicitly set by JS.
   */
  private class TextWatcherDelegator implements TextWatcher {
    @Override
    public void beforeTextChanged(CharSequence s, int start, int count, int after) {
      if (!mIsSettingTextFromJS && mListeners != null) {
        for (TextWatcher listener : mListeners) {
          listener.beforeTextChanged(s, start, count, after);
        }
      }
    }

    @Override
    public void onTextChanged(CharSequence s, int start, int before, int count) {
      if (!mIsSettingTextFromJS && mListeners != null) {
        for (TextWatcher listener : mListeners) {
          listener.onTextChanged(s, start, before, count);
        }
      }
    }

    @Override
    public void afterTextChanged(Editable s) {
      if (!mIsSettingTextFromJS && mListeners != null) {
        for (android.text.TextWatcher listener : mListeners) {
          listener.afterTextChanged(s);
        }
      }
    }
  }
}

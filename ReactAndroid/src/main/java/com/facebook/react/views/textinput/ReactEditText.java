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
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.text.Editable;
import android.text.InputType;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.TextWatcher;
import android.text.method.KeyListener;
import android.text.method.QwertyKeyListener;
import android.text.style.AbsoluteSizeSpan;
import android.text.style.BackgroundColorSpan;
import android.text.style.ForegroundColorSpan;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.views.text.CustomStyleSpan;
import com.facebook.react.views.text.ReactTagSpan;
import com.facebook.react.views.text.ReactTextUpdate;
import com.facebook.react.views.text.TextInlineImageSpan;
import com.facebook.react.views.view.ReactViewBackgroundDrawable;

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
  private int mMostRecentEventCount;
  private @Nullable ArrayList<TextWatcher> mListeners;
  private @Nullable TextWatcherDelegator mTextWatcherDelegator;
  private int mStagedInputType;
  private boolean mContainsImages;
  private boolean mBlurOnSubmit;
  private boolean mDisableFullscreen;
  private @Nullable String mReturnKeyType;
  private @Nullable SelectionWatcher mSelectionWatcher;
  private @Nullable ContentSizeWatcher mContentSizeWatcher;
  private final InternalKeyListener mKeyListener;
  private boolean mDetectScrollMovement = false;

  private ReactViewBackgroundDrawable mReactBackgroundDrawable;

  private static final KeyListener sKeyListener = QwertyKeyListener.getInstanceForFullKeyboard();

  public ReactEditText(Context context) {
    super(context);
    setFocusableInTouchMode(false);

    mInputMethodManager = (InputMethodManager)
        Assertions.assertNotNull(getContext().getSystemService(Context.INPUT_METHOD_SERVICE));
    mDefaultGravityHorizontal =
        getGravity() & (Gravity.HORIZONTAL_GRAVITY_MASK | Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK);
    mDefaultGravityVertical = getGravity() & Gravity.VERTICAL_GRAVITY_MASK;
    mNativeEventCount = 0;
    mMostRecentEventCount = 0;
    mIsSettingTextFromJS = false;
    mIsJSSettingFocus = false;
    mBlurOnSubmit = true;
    mDisableFullscreen = false;
    mListeners = null;
    mTextWatcherDelegator = null;
    mStagedInputType = getInputType();
    mKeyListener = new InternalKeyListener();
  }

  // After the text changes inside an EditText, TextView checks if a layout() has been requested.
  // If it has, it will not scroll the text to the end of the new text inserted, but wait for the
  // next layout() to be called. However, we do not perform a layout() after a requestLayout(), so
  // we need to override isLayoutRequested to force EditText to scroll to the end of the new text
  // immediately.
  // TODO: t6408636 verify if we should schedule a layout after a View does a requestLayout()
  @Override
  public boolean isLayoutRequested() {
    // If we are watching and updating container height based on content size
    // then we don't want to scroll right away. This isn't perfect -- you might
    // want to limit the height the text input can grow to. Possible solution
    // is to add another prop that determines whether we should scroll to end
    // of text.
    if (mContentSizeWatcher != null) {
      return isMultiline();
    } else {
      return false;
    }
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    if (mContentSizeWatcher != null) {
      mContentSizeWatcher.onLayout();
    }
  }

  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    switch (ev.getAction()) {
      case MotionEvent.ACTION_DOWN:
        mDetectScrollMovement = true;
        // Disallow parent views to intercept touch events, until we can detect if we should be
        // capturing these touches or not.
        this.getParent().requestDisallowInterceptTouchEvent(true);
        break;
      case MotionEvent.ACTION_MOVE:
        if (mDetectScrollMovement) {
          if (!canScrollVertically(-1) &&
              !canScrollVertically(1) &&
              !canScrollHorizontally(-1) &&
              !canScrollHorizontally(1)) {
            // We cannot scroll, let parent views take care of these touches.
            this.getParent().requestDisallowInterceptTouchEvent(false);
          }
          mDetectScrollMovement = false;
        }
        break;
    }
    return super.onTouchEvent(ev);
  }

  // Consume 'Enter' key events: TextView tries to give focus to the next TextInput, but it can't
  // since we only allow JS to change focus, which in turn causes TextView to crash.
  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_ENTER && !isMultiline()) {
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

  public void setContentSizeWatcher(ContentSizeWatcher contentSizeWatcher) {
    mContentSizeWatcher = contentSizeWatcher;
  }

  @Override
  public void setSelection(int start, int end) {
    // Skip setting the selection if the text wasn't set because of an out of date value.
    if (mMostRecentEventCount < mNativeEventCount) {
      return;
    }

    super.setSelection(start, end);
  }

  @Override
  protected void onSelectionChanged(int selStart, int selEnd) {
    super.onSelectionChanged(selStart, selEnd);
    if (mSelectionWatcher != null && hasFocus()) {
      mSelectionWatcher.onSelectionChanged(selStart, selEnd);
    }
  }

  @Override
  protected void onFocusChanged(
      boolean focused, int direction, Rect previouslyFocusedRect) {
    super.onFocusChanged(focused, direction, previouslyFocusedRect);
    if (focused && mSelectionWatcher != null) {
      mSelectionWatcher.onSelectionChanged(getSelectionStart(), getSelectionEnd());
    }
  }

  public void setSelectionWatcher(SelectionWatcher selectionWatcher) {
    mSelectionWatcher = selectionWatcher;
  }

  public void setBlurOnSubmit(boolean blurOnSubmit) {
    mBlurOnSubmit = blurOnSubmit;
  }

  public boolean getBlurOnSubmit() {
    return mBlurOnSubmit;
  }

  public void setDisableFullscreenUI(boolean disableFullscreenUI) {
    mDisableFullscreen = disableFullscreenUI;
    updateImeOptions();
  }

  public boolean getDisableFullscreenUI() {
    return mDisableFullscreen;
  }

  public void setReturnKeyType(String returnKeyType) {
    mReturnKeyType = returnKeyType;
    updateImeOptions();
  }

  public String getReturnKeyType() {
    return mReturnKeyType;
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
    Typeface tf = super.getTypeface();
    super.setInputType(type);
    mStagedInputType = type;
    // Input type password defaults to monospace font, so we need to re-apply the font
    super.setTypeface(tf);

    // We override the KeyListener so that all keys on the soft input keyboard as well as hardware
    // keyboards work. Some KeyListeners like DigitsKeyListener will display the keyboard but not
    // accept all input from it
    mKeyListener.setInputType(type);
    setKeyListener(mKeyListener);
  }

  // VisibleForTesting from {@link TextInputEventsTestCase}.
  public void requestFocusFromJS() {
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
    mMostRecentEventCount = reactTextUpdate.getJsEventCounter();
    if (mMostRecentEventCount < mNativeEventCount) {
      return;
    }

    // The current text gets replaced with the text received from JS. However, the spans on the
    // current text need to be adapted to the new text. Since TextView#setText() will remove or
    // reset some of these spans even if they are set directly, SpannableStringBuilder#replace() is
    // used instead (this is also used by the the keyboard implementation underneath the covers).
    SpannableStringBuilder spannableStringBuilder =
        new SpannableStringBuilder(reactTextUpdate.getText());
    manageSpans(spannableStringBuilder);
    mContainsImages = reactTextUpdate.containsImages();
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
      // Remove all styling spans we might have previously set
      if (ForegroundColorSpan.class.isInstance(spans[spanIdx]) ||
          BackgroundColorSpan.class.isInstance(spans[spanIdx]) ||
          AbsoluteSizeSpan.class.isInstance(spans[spanIdx]) ||
          CustomStyleSpan.class.isInstance(spans[spanIdx]) ||
          ReactTagSpan.class.isInstance(spans[spanIdx])) {
        getText().removeSpan(spans[spanIdx]);
      }

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

  private boolean isMultiline() {
    return (getInputType() & InputType.TYPE_TEXT_FLAG_MULTI_LINE) != 0;
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

  private void updateImeOptions() {
    // Default to IME_ACTION_DONE
    int returnKeyFlag = EditorInfo.IME_ACTION_DONE;
    if (mReturnKeyType != null) {
      switch (mReturnKeyType) {
        case "go":
          returnKeyFlag = EditorInfo.IME_ACTION_GO;
          break;
        case "next":
          returnKeyFlag = EditorInfo.IME_ACTION_NEXT;
          break;
        case "none":
          returnKeyFlag = EditorInfo.IME_ACTION_NONE;
          break;
        case "previous":
          returnKeyFlag = EditorInfo.IME_ACTION_PREVIOUS;
          break;
        case "search":
          returnKeyFlag = EditorInfo.IME_ACTION_SEARCH;
          break;
        case "send":
          returnKeyFlag = EditorInfo.IME_ACTION_SEND;
          break;
        case "done":
          returnKeyFlag = EditorInfo.IME_ACTION_DONE;
          break;
      }
    }

    if (mDisableFullscreen) {
      setImeOptions(returnKeyFlag | EditorInfo.IME_FLAG_NO_FULLSCREEN);
    } else {
      setImeOptions(returnKeyFlag);
    }
  }

  @Override
  protected boolean verifyDrawable(Drawable drawable) {
    if (mContainsImages && getText() instanceof Spanned) {
      Spanned text = (Spanned) getText();
      TextInlineImageSpan[] spans = text.getSpans(0, text.length(), TextInlineImageSpan.class);
      for (TextInlineImageSpan span : spans) {
        if (span.getDrawable() == drawable) {
          return true;
        }
      }
    }
    return super.verifyDrawable(drawable);
  }

  @Override
  public void invalidateDrawable(Drawable drawable) {
    if (mContainsImages && getText() instanceof Spanned) {
      Spanned text = (Spanned) getText();
      TextInlineImageSpan[] spans = text.getSpans(0, text.length(), TextInlineImageSpan.class);
      for (TextInlineImageSpan span : spans) {
        if (span.getDrawable() == drawable) {
          invalidate();
        }
      }
    }
    super.invalidateDrawable(drawable);
  }

  @Override
  public void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    if (mContainsImages && getText() instanceof Spanned) {
      Spanned text = (Spanned) getText();
      TextInlineImageSpan[] spans = text.getSpans(0, text.length(), TextInlineImageSpan.class);
      for (TextInlineImageSpan span : spans) {
        span.onDetachedFromWindow();
      }
    }
  }

  @Override
  public void onStartTemporaryDetach() {
    super.onStartTemporaryDetach();
    if (mContainsImages && getText() instanceof Spanned) {
      Spanned text = (Spanned) getText();
      TextInlineImageSpan[] spans = text.getSpans(0, text.length(), TextInlineImageSpan.class);
      for (TextInlineImageSpan span : spans) {
        span.onStartTemporaryDetach();
      }
    }
  }

  @Override
  public void onAttachedToWindow() {
    super.onAttachedToWindow();
    if (mContainsImages && getText() instanceof Spanned) {
      Spanned text = (Spanned) getText();
      TextInlineImageSpan[] spans = text.getSpans(0, text.length(), TextInlineImageSpan.class);
      for (TextInlineImageSpan span : spans) {
        span.onAttachedToWindow();
      }
    }
  }

  @Override
  public void onFinishTemporaryDetach() {
    super.onFinishTemporaryDetach();
    if (mContainsImages && getText() instanceof Spanned) {
      Spanned text = (Spanned) getText();
      TextInlineImageSpan[] spans = text.getSpans(0, text.length(), TextInlineImageSpan.class);
      for (TextInlineImageSpan span : spans) {
        span.onFinishTemporaryDetach();
      }
    }
  }

  @Override
  public void setBackgroundColor(int color) {
    if (color == Color.TRANSPARENT && mReactBackgroundDrawable == null) {
      // don't do anything, no need to allocate ReactBackgroundDrawable for transparent background
    } else {
      getOrCreateReactViewBackground().setColor(color);
    }
  }

  public void setBorderWidth(int position, float width) {
    getOrCreateReactViewBackground().setBorderWidth(position, width);
  }

  public void setBorderColor(int position, float color, float alpha) {
    getOrCreateReactViewBackground().setBorderColor(position, color, alpha);
  }

  public void setBorderRadius(float borderRadius) {
    getOrCreateReactViewBackground().setRadius(borderRadius);
  }

  public void setBorderRadius(float borderRadius, int position) {
    getOrCreateReactViewBackground().setRadius(borderRadius, position);
  }

  public void setBorderStyle(@Nullable String style) {
    getOrCreateReactViewBackground().setBorderStyle(style);
  }

  private ReactViewBackgroundDrawable getOrCreateReactViewBackground() {
    if (mReactBackgroundDrawable == null) {
      mReactBackgroundDrawable = new ReactViewBackgroundDrawable();
      Drawable backgroundDrawable = getBackground();
      super.setBackground(null);  // required so that drawable callback is cleared before we add the
      // drawable back as a part of LayerDrawable
      if (backgroundDrawable == null) {
        super.setBackground(mReactBackgroundDrawable);
      } else {
        LayerDrawable layerDrawable =
            new LayerDrawable(new Drawable[]{mReactBackgroundDrawable, backgroundDrawable});
        super.setBackground(layerDrawable);
      }
    }
    return mReactBackgroundDrawable;
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
        for (TextWatcher listener : mListeners) {
          listener.afterTextChanged(s);
        }
      }
    }
  }

  /*
   * This class is set as the KeyListener for the underlying TextView
   * It does two things
   *  1) Provides the same answer to getInputType() as the real KeyListener would have which allows
   *     the proper keyboard to pop up on screen
   *  2) Permits all keyboard input through
   */
  private static class InternalKeyListener implements KeyListener {

    private int mInputType = 0;

    public InternalKeyListener() {
    }

    public void setInputType(int inputType) {
      mInputType = inputType;
    }

    /*
     * getInputType will return whatever value is passed in.  This will allow the proper keyboard
     * to be shown on screen but without the actual filtering done by other KeyListeners
     */
    @Override
    public int getInputType() {
      return mInputType;
    }

    /*
     * All overrides of key handling defer to the underlying KeyListener which is shared by all
     * ReactEditText instances.  It will basically allow any/all keyboard input whether from
     * physical keyboard or from soft input.
     */
    @Override
    public boolean onKeyDown(View view, Editable text, int keyCode, KeyEvent event) {
      return sKeyListener.onKeyDown(view, text, keyCode, event);
    }

    @Override
    public boolean onKeyUp(View view, Editable text, int keyCode, KeyEvent event) {
      return sKeyListener.onKeyUp(view, text, keyCode, event);
    }

    @Override
    public boolean onKeyOther(View view, Editable text, KeyEvent event) {
      return sKeyListener.onKeyOther(view, text, event);
    }

    @Override
    public void clearMetaKeyState(View view, Editable content, int states) {
      sKeyListener.clearMetaKeyState(view, content, states);
    }
  }
}

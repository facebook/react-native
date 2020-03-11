/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import static com.facebook.react.uimanager.UIManagerHelper.getReactContext;

import android.content.Context;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Bundle;
import android.text.Editable;
import android.text.InputType;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.text.method.KeyListener;
import android.text.method.QwertyKeyListener;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputMethodManager;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatEditText;
import androidx.core.view.AccessibilityDelegateCompat;
import androidx.core.view.ViewCompat;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.views.text.ReactSpan;
import com.facebook.react.views.text.ReactTextUpdate;
import com.facebook.react.views.text.ReactTypefaceUtils;
import com.facebook.react.views.text.TextAttributes;
import com.facebook.react.views.text.TextInlineImageSpan;
import com.facebook.react.views.view.ReactViewBackgroundManager;
import java.util.ArrayList;

/**
 * A wrapper around the EditText that lets us better control what happens when an EditText gets
 * focused or blurred, and when to display the soft keyboard and when not to.
 *
 * <p>ReactEditTexts have setFocusableInTouchMode set to false automatically because touches on the
 * EditText are managed on the JS side. This also removes the nasty side effect that EditTexts have,
 * which is that focus is always maintained on one of the EditTexts.
 *
 * <p>The wrapper stops the EditText from triggering *TextChanged events, in the case where JS has
 * called this explicitly. This is the default behavior on other platforms as well.
 * VisibleForTesting from {@link TextInputEventsTestCase}.
 */
public class ReactEditText extends AppCompatEditText {

  private final InputMethodManager mInputMethodManager;
  // This flag is set to true when we set the text of the EditText explicitly. In that case, no
  // *TextChanged events should be triggered. This is less expensive than removing the text
  // listeners and adding them back again after the text change is completed.
  protected boolean mIsSettingTextFromJS;
  private int mDefaultGravityHorizontal;
  private int mDefaultGravityVertical;

  /** A count of events sent to JS or C++. */
  protected int mNativeEventCount;

  private static final int UNSET = -1;

  private @Nullable ArrayList<TextWatcher> mListeners;
  private @Nullable TextWatcherDelegator mTextWatcherDelegator;
  private int mStagedInputType;
  protected boolean mContainsImages;
  private @Nullable Boolean mBlurOnSubmit;
  private boolean mDisableFullscreen;
  private @Nullable String mReturnKeyType;
  private @Nullable SelectionWatcher mSelectionWatcher;
  private @Nullable ContentSizeWatcher mContentSizeWatcher;
  private @Nullable ScrollWatcher mScrollWatcher;
  private final InternalKeyListener mKeyListener;
  private boolean mDetectScrollMovement = false;
  private boolean mOnKeyPress = false;
  private TextAttributes mTextAttributes;
  private boolean mTypefaceDirty = false;
  private @Nullable String mFontFamily = null;
  private int mFontWeight = ReactTypefaceUtils.UNSET;
  private int mFontStyle = ReactTypefaceUtils.UNSET;
  private boolean mAutoFocus = false;
  private boolean mDidAttachToWindow = false;

  private ReactViewBackgroundManager mReactBackgroundManager;

  protected @Nullable JavaOnlyMap mAttributedString = null;
  protected @Nullable StateWrapper mStateWrapper = null;
  protected boolean mDisableTextDiffing = false;

  protected boolean mIsSettingTextFromState = false;

  private static final KeyListener sKeyListener = QwertyKeyListener.getInstanceForFullKeyboard();

  public ReactEditText(Context context) {
    super(context);
    setFocusableInTouchMode(false);

    mReactBackgroundManager = new ReactViewBackgroundManager(this);
    mInputMethodManager =
        (InputMethodManager)
            Assertions.assertNotNull(context.getSystemService(Context.INPUT_METHOD_SERVICE));
    mDefaultGravityHorizontal =
        getGravity() & (Gravity.HORIZONTAL_GRAVITY_MASK | Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK);
    mDefaultGravityVertical = getGravity() & Gravity.VERTICAL_GRAVITY_MASK;
    mNativeEventCount = 0;
    mIsSettingTextFromJS = false;
    mBlurOnSubmit = null;
    mDisableFullscreen = false;
    mListeners = null;
    mTextWatcherDelegator = null;
    mStagedInputType = getInputType();
    mKeyListener = new InternalKeyListener();
    mScrollWatcher = null;
    mTextAttributes = new TextAttributes();

    applyTextAttributes();

    // Turn off hardware acceleration for Oreo (T40484798)
    // see https://issuetracker.google.com/issues/67102093
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
        && Build.VERSION.SDK_INT <= Build.VERSION_CODES.O_MR1) {
      setLayerType(View.LAYER_TYPE_SOFTWARE, null);
    }

    ViewCompat.setAccessibilityDelegate(
        this,
        new AccessibilityDelegateCompat() {
          @Override
          public boolean performAccessibilityAction(View host, int action, Bundle args) {
            if (action == AccessibilityNodeInfo.ACTION_CLICK) {
              return requestFocusInternal();
            }
            return super.performAccessibilityAction(host, action, args);
          }
        });
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

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    onContentSizeChange();
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
          if (!canScrollVertically(-1)
              && !canScrollVertically(1)
              && !canScrollHorizontally(-1)
              && !canScrollHorizontally(1)) {
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
  protected void onScrollChanged(int horiz, int vert, int oldHoriz, int oldVert) {
    super.onScrollChanged(horiz, vert, oldHoriz, oldVert);

    if (mScrollWatcher != null) {
      mScrollWatcher.onScrollChanged(horiz, vert, oldHoriz, oldVert);
    }
  }

  @Override
  public InputConnection onCreateInputConnection(EditorInfo outAttrs) {
    ReactContext reactContext = getReactContext(this);
    InputConnection inputConnection = super.onCreateInputConnection(outAttrs);
    if (inputConnection != null && mOnKeyPress) {
      inputConnection =
          new ReactEditTextInputConnectionWrapper(inputConnection, reactContext, this);
    }

    if (isMultiline() && getBlurOnSubmit()) {
      // Remove IME_FLAG_NO_ENTER_ACTION to keep the original IME_OPTION
      outAttrs.imeOptions &= ~EditorInfo.IME_FLAG_NO_ENTER_ACTION;
    }
    return inputConnection;
  }

  @Override
  public void clearFocus() {
    setFocusableInTouchMode(false);
    super.clearFocus();
    hideSoftKeyboard();
  }

  @Override
  public boolean requestFocus(int direction, Rect previouslyFocusedRect) {
    // This is a no-op so that when the OS calls requestFocus(), nothing will happen. ReactEditText
    // is a controlled component, which means its focus is controlled by JS, with two exceptions:
    // autofocus when it's attached to the window, and responding to accessibility events. In both
    // of these cases, we call requestFocusInternal() directly.
    return isFocused();
  }

  private boolean requestFocusInternal() {
    setFocusableInTouchMode(true);
    // We must explicitly call this method on the super class; if we call requestFocus() without
    // any arguments, it will call into the overridden requestFocus(int, Rect) above, which no-ops.
    boolean focused = super.requestFocus(View.FOCUS_DOWN, null);
    if (getShowSoftInputOnFocus()) {
      showSoftKeyboard();
    }
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

  public void setScrollWatcher(ScrollWatcher scrollWatcher) {
    mScrollWatcher = scrollWatcher;
  }

  /**
   * Attempt to set a selection or fail silently. Intentionally meant to handle bad inputs.
   * EventCounter is the same one used as with text.
   *
   * @param eventCounter
   * @param start
   * @param end
   */
  public void maybeSetSelection(int eventCounter, int start, int end) {
    if (!canUpdateWithEventCount(eventCounter)) {
      return;
    }

    if (start != UNSET && end != UNSET) {
      setSelection(start, end);
    }
  }

  @Override
  public void setSelection(int start, int end) {
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
  protected void onFocusChanged(boolean focused, int direction, Rect previouslyFocusedRect) {
    super.onFocusChanged(focused, direction, previouslyFocusedRect);
    if (focused && mSelectionWatcher != null) {
      mSelectionWatcher.onSelectionChanged(getSelectionStart(), getSelectionEnd());
    }
  }

  public void setSelectionWatcher(SelectionWatcher selectionWatcher) {
    mSelectionWatcher = selectionWatcher;
  }

  public void setBlurOnSubmit(@Nullable Boolean blurOnSubmit) {
    mBlurOnSubmit = blurOnSubmit;
  }

  public void setOnKeyPress(boolean onKeyPress) {
    mOnKeyPress = onKeyPress;
  }

  public boolean getBlurOnSubmit() {
    if (mBlurOnSubmit == null) {
      // Default blurOnSubmit
      return isMultiline() ? false : true;
    }

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
      int selectionStart = getSelectionStart();
      int selectionEnd = getSelectionEnd();
      setInputType(mStagedInputType);
      setSelection(selectionStart, selectionEnd);
    }
  }

  @Override
  public void setInputType(int type) {
    Typeface tf = super.getTypeface();
    super.setInputType(type);
    mStagedInputType = type;
    // Input type password defaults to monospace font, so we need to re-apply the font
    super.setTypeface(tf);

    /**
     * If set forces multiline on input, because of a restriction on Android source that enables
     * multiline only for inputs of type Text and Multiline on method {@link
     * android.widget.TextView#isMultilineInputType(int)}} Source: {@Link <a
     * href='https://android.googlesource.com/platform/frameworks/base/+/jb-release/core/java/android/widget/TextView.java'>TextView.java</a>}
     */
    if (isMultiline()) {
      setSingleLine(false);
    }

    // We override the KeyListener so that all keys on the soft input keyboard as well as hardware
    // keyboards work. Some KeyListeners like DigitsKeyListener will display the keyboard but not
    // accept all input from it
    mKeyListener.setInputType(type);
    setKeyListener(mKeyListener);
  }

  public void setFontFamily(String fontFamily) {
    mFontFamily = fontFamily;
    mTypefaceDirty = true;
  }

  public void setFontWeight(String fontWeightString) {
    int fontWeight = ReactTypefaceUtils.parseFontWeight(fontWeightString);
    if (fontWeight != mFontWeight) {
      mFontWeight = fontWeight;
      mTypefaceDirty = true;
    }
  }

  public void setFontStyle(String fontStyleString) {
    int fontStyle = ReactTypefaceUtils.parseFontStyle(fontStyleString);
    if (fontStyle != mFontStyle) {
      mFontStyle = fontStyle;
      mTypefaceDirty = true;
    }
  }

  public void maybeUpdateTypeface() {
    if (!mTypefaceDirty) {
      return;
    }

    mTypefaceDirty = false;

    Typeface newTypeface =
        ReactTypefaceUtils.applyStyles(
            getTypeface(), mFontStyle, mFontWeight, mFontFamily, getContext().getAssets());
    setTypeface(newTypeface);
  }

  // VisibleForTesting from {@link TextInputEventsTestCase}.
  public void requestFocusFromJS() {
    requestFocusInternal();
  }

  /* package */ void clearFocusFromJS() {
    clearFocus();
  }

  // VisibleForTesting from {@link TextInputEventsTestCase}.
  public int incrementAndGetEventCounter() {
    return ++mNativeEventCount;
  }

  public void maybeSetTextFromJS(ReactTextUpdate reactTextUpdate) {
    mIsSettingTextFromJS = true;
    maybeSetText(reactTextUpdate);
    mIsSettingTextFromJS = false;
  }

  public void maybeSetTextFromState(ReactTextUpdate reactTextUpdate) {
    mIsSettingTextFromState = true;
    maybeSetText(reactTextUpdate);
    mIsSettingTextFromState = false;
  }

  public boolean canUpdateWithEventCount(int eventCounter) {
    return eventCounter >= mNativeEventCount;
  }

  // VisibleForTesting from {@link TextInputEventsTestCase}.
  public void maybeSetText(ReactTextUpdate reactTextUpdate) {
    if (isSecureText() && TextUtils.equals(getText(), reactTextUpdate.getText())) {
      return;
    }

    // Only set the text if it is up to date.
    if (!canUpdateWithEventCount(reactTextUpdate.getJsEventCounter())) {
      return;
    }

    if (reactTextUpdate.mAttributedString != null) {
      mAttributedString = JavaOnlyMap.deepClone(reactTextUpdate.mAttributedString);
    }

    // The current text gets replaced with the text received from JS. However, the spans on the
    // current text need to be adapted to the new text. Since TextView#setText() will remove or
    // reset some of these spans even if they are set directly, SpannableStringBuilder#replace() is
    // used instead (this is also used by the keyboard implementation underneath the covers).
    SpannableStringBuilder spannableStringBuilder =
        new SpannableStringBuilder(reactTextUpdate.getText());
    manageSpans(spannableStringBuilder);
    mContainsImages = reactTextUpdate.containsImages();

    // When we update text, we trigger onChangeText code that will
    // try to update state if the wrapper is available. Temporarily disable
    // to prevent an (asynchronous) infinite loop.
    mDisableTextDiffing = true;

    // On some devices, when the text is cleared, buggy keyboards will not clear the composing
    // text so, we have to set text to null, which will clear the currently composing text.
    if (reactTextUpdate.getText().length() == 0) {
      setText(null);
    } else {
      // When we update text, we trigger onChangeText code that will
      // try to update state if the wrapper is available. Temporarily disable
      // to prevent an infinite loop.
      getText().replace(0, length(), spannableStringBuilder);
    }
    mDisableTextDiffing = false;

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (getBreakStrategy() != reactTextUpdate.getTextBreakStrategy()) {
        setBreakStrategy(reactTextUpdate.getTextBreakStrategy());
      }
    }
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
      if (spans[spanIdx] instanceof ReactSpan) {
        getText().removeSpan(spans[spanIdx]);
      }

      if ((getText().getSpanFlags(spans[spanIdx]) & Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
          != Spanned.SPAN_EXCLUSIVE_EXCLUSIVE) {
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

  protected boolean showSoftKeyboard() {
    return mInputMethodManager.showSoftInput(this, 0);
  }

  protected void hideSoftKeyboard() {
    mInputMethodManager.hideSoftInputFromWindow(getWindowToken(), 0);
  }

  private TextWatcherDelegator getTextWatcherDelegator() {
    if (mTextWatcherDelegator == null) {
      mTextWatcherDelegator = new TextWatcherDelegator();
    }
    return mTextWatcherDelegator;
  }

  /* package */ boolean isMultiline() {
    return (getInputType() & InputType.TYPE_TEXT_FLAG_MULTI_LINE) != 0;
  }

  private boolean isSecureText() {
    return (getInputType()
            & (InputType.TYPE_NUMBER_VARIATION_PASSWORD | InputType.TYPE_TEXT_VARIATION_PASSWORD))
        != 0;
  }

  private void onContentSizeChange() {
    if (mContentSizeWatcher != null) {
      mContentSizeWatcher.onLayout();
    }

    setIntrinsicContentSize();
  }

  // TODO T58784068: delete this method
  private void setIntrinsicContentSize() {
    // This serves as a check for whether we're running under Paper or Fabric.
    // By the time this is called, in Fabric we will have a state
    // wrapper 100% of the time.
    // Since the LocalData object is constructed by getting values from the underlying EditText
    // view, we don't need to construct one or apply it at all - it provides no use in Fabric.
    if (mStateWrapper == null) {
      ReactContext reactContext = getReactContext(this);
      final ReactTextInputLocalData localData = new ReactTextInputLocalData(this);
      UIManagerModule uiManager = reactContext.getNativeModule(UIManagerModule.class);
      uiManager.setViewLocalData(getId(), localData);
    }
  }

  /* package */ void setGravityHorizontal(int gravityHorizontal) {
    if (gravityHorizontal == 0) {
      gravityHorizontal = mDefaultGravityHorizontal;
    }
    setGravity(
        (getGravity()
                & ~Gravity.HORIZONTAL_GRAVITY_MASK
                & ~Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK)
            | gravityHorizontal);
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
    if (mContainsImages) {
      Spanned text = getText();
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
    if (mContainsImages) {
      Spanned text = getText();
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
    if (mContainsImages) {
      Spanned text = getText();
      TextInlineImageSpan[] spans = text.getSpans(0, text.length(), TextInlineImageSpan.class);
      for (TextInlineImageSpan span : spans) {
        span.onDetachedFromWindow();
      }
    }
  }

  @Override
  public void onStartTemporaryDetach() {
    super.onStartTemporaryDetach();
    if (mContainsImages) {
      Spanned text = getText();
      TextInlineImageSpan[] spans = text.getSpans(0, text.length(), TextInlineImageSpan.class);
      for (TextInlineImageSpan span : spans) {
        span.onStartTemporaryDetach();
      }
    }
  }

  @Override
  public void onAttachedToWindow() {
    super.onAttachedToWindow();
    if (mContainsImages) {
      Spanned text = getText();
      TextInlineImageSpan[] spans = text.getSpans(0, text.length(), TextInlineImageSpan.class);
      for (TextInlineImageSpan span : spans) {
        span.onAttachedToWindow();
      }
    }

    if (mAutoFocus && !mDidAttachToWindow) {
      requestFocusInternal();
    }

    mDidAttachToWindow = true;
  }

  @Override
  public void onFinishTemporaryDetach() {
    super.onFinishTemporaryDetach();
    if (mContainsImages) {
      Spanned text = getText();
      TextInlineImageSpan[] spans = text.getSpans(0, text.length(), TextInlineImageSpan.class);
      for (TextInlineImageSpan span : spans) {
        span.onFinishTemporaryDetach();
      }
    }
  }

  @Override
  public void setBackgroundColor(int color) {
    mReactBackgroundManager.setBackgroundColor(color);
  }

  public void setBorderWidth(int position, float width) {
    mReactBackgroundManager.setBorderWidth(position, width);
  }

  public void setBorderColor(int position, float color, float alpha) {
    mReactBackgroundManager.setBorderColor(position, color, alpha);
  }

  public void setBorderRadius(float borderRadius) {
    mReactBackgroundManager.setBorderRadius(borderRadius);
  }

  public void setBorderRadius(float borderRadius, int position) {
    mReactBackgroundManager.setBorderRadius(borderRadius, position);
  }

  public void setBorderStyle(@Nullable String style) {
    mReactBackgroundManager.setBorderStyle(style);
  }

  public void setLetterSpacingPt(float letterSpacingPt) {
    mTextAttributes.setLetterSpacing(letterSpacingPt);
    applyTextAttributes();
  }

  public void setAllowFontScaling(boolean allowFontScaling) {
    if (mTextAttributes.getAllowFontScaling() != allowFontScaling) {
      mTextAttributes.setAllowFontScaling(allowFontScaling);
      applyTextAttributes();
    }
  }

  public void setFontSize(float fontSize) {
    mTextAttributes.setFontSize(fontSize);
    applyTextAttributes();
  }

  public void setMaxFontSizeMultiplier(float maxFontSizeMultiplier) {
    if (maxFontSizeMultiplier != mTextAttributes.getMaxFontSizeMultiplier()) {
      mTextAttributes.setMaxFontSizeMultiplier(maxFontSizeMultiplier);
      applyTextAttributes();
    }
  }

  public void setAutoFocus(boolean autoFocus) {
    mAutoFocus = autoFocus;
  }

  protected void applyTextAttributes() {
    // In general, the `getEffective*` functions return `Float.NaN` if the
    // property hasn't been set.

    // `getEffectiveFontSize` always returns a value so don't need to check for anything like
    // `Float.NaN`.
    setTextSize(TypedValue.COMPLEX_UNIT_PX, mTextAttributes.getEffectiveFontSize());

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      float effectiveLetterSpacing = mTextAttributes.getEffectiveLetterSpacing();
      if (!Float.isNaN(effectiveLetterSpacing)) {
        setLetterSpacing(effectiveLetterSpacing);
      }
    }
  }

  /**
   * This class will redirect *TextChanged calls to the listeners only in the case where the text is
   * changed by the user, and not explicitly set by JS.
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

      onContentSizeChange();
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

    public InternalKeyListener() {}

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

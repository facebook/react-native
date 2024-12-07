/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import static com.facebook.react.uimanager.UIManagerHelper.getReactContext;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Bundle;
import android.text.Editable;
import android.text.InputType;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.text.method.KeyListener;
import android.text.method.QwertyKeyListener;
import android.util.TypedValue;
import android.view.ActionMode;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.MotionEvent;
import android.view.View;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputMethodManager;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatEditText;
import androidx.core.util.Predicate;
import androidx.core.view.ViewCompat;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.uimanager.BackgroundStyleApplicator;
import com.facebook.react.uimanager.LengthPercentage;
import com.facebook.react.uimanager.LengthPercentageType;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactAccessibilityDelegate;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.style.BorderRadiusProp;
import com.facebook.react.uimanager.style.BorderStyle;
import com.facebook.react.uimanager.style.LogicalEdge;
import com.facebook.react.uimanager.style.Overflow;
import com.facebook.react.views.text.ReactTextUpdate;
import com.facebook.react.views.text.ReactTypefaceUtils;
import com.facebook.react.views.text.TextAttributes;
import com.facebook.react.views.text.TextLayoutManager;
import com.facebook.react.views.text.internal.span.CustomLetterSpacingSpan;
import com.facebook.react.views.text.internal.span.CustomLineHeightSpan;
import com.facebook.react.views.text.internal.span.CustomStyleSpan;
import com.facebook.react.views.text.internal.span.ReactAbsoluteSizeSpan;
import com.facebook.react.views.text.internal.span.ReactBackgroundColorSpan;
import com.facebook.react.views.text.internal.span.ReactForegroundColorSpan;
import com.facebook.react.views.text.internal.span.ReactSpan;
import com.facebook.react.views.text.internal.span.ReactStrikethroughSpan;
import com.facebook.react.views.text.internal.span.ReactUnderlineSpan;
import com.facebook.react.views.text.internal.span.TextInlineImageSpan;
import com.facebook.react.views.view.ReactViewBackgroundManager;
import java.util.ArrayList;
import java.util.Objects;

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
  private final String TAG = ReactEditText.class.getSimpleName();
  public static final boolean DEBUG_MODE = ReactBuildConfig.DEBUG && false;

  // This flag is set to true when we set the text of the EditText explicitly. In that case, no
  // *TextChanged events should be triggered. This is less expensive than removing the text
  // listeners and adding them back again after the text change is completed.
  protected boolean mIsSettingTextFromJS;
  private final int mDefaultGravityHorizontal;
  private final int mDefaultGravityVertical;

  /** A count of events sent to JS or C++. */
  protected int mNativeEventCount;

  private @Nullable ArrayList<TextWatcher> mListeners;
  private @Nullable TextWatcherDelegator mTextWatcherDelegator;
  private int mStagedInputType;
  protected boolean mContainsImages;
  private @Nullable String mSubmitBehavior = null;
  private boolean mDisableFullscreen;
  private @Nullable String mReturnKeyType;
  private @Nullable SelectionWatcher mSelectionWatcher;
  private @Nullable ContentSizeWatcher mContentSizeWatcher;
  private @Nullable ScrollWatcher mScrollWatcher;
  private InternalKeyListener mKeyListener;
  private boolean mDetectScrollMovement = false;
  private boolean mOnKeyPress = false;
  private TextAttributes mTextAttributes;
  private boolean mTypefaceDirty = false;
  private @Nullable String mFontFamily = null;
  private int mFontWeight = ReactConstants.UNSET;
  private int mFontStyle = ReactConstants.UNSET;
  private boolean mAutoFocus = false;
  private boolean mContextMenuHidden = false;
  private boolean mDidAttachToWindow = false;
  private boolean mSelectTextOnFocus = false;
  private @Nullable String mPlaceholder = null;
  private Overflow mOverflow = Overflow.VISIBLE;

  private final ReactViewBackgroundManager mReactBackgroundManager;

  private StateWrapper mStateWrapper = null;
  protected boolean mDisableTextDiffing = false;

  protected boolean mIsSettingTextFromState = false;

  private static final KeyListener sKeyListener = QwertyKeyListener.getInstanceForFullKeyboard();
  private @Nullable EventDispatcher mEventDispatcher;

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
    mDisableFullscreen = false;
    mListeners = null;
    mTextWatcherDelegator = null;
    mStagedInputType = getInputType();
    if (mKeyListener == null) {
      mKeyListener = new InternalKeyListener();
    }
    mScrollWatcher = null;
    mTextAttributes = new TextAttributes();

    applyTextAttributes();

    // Turn off hardware acceleration for Oreo (T40484798)
    // see https://issuetracker.google.com/issues/67102093
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
        && Build.VERSION.SDK_INT <= Build.VERSION_CODES.O_MR1) {
      setLayerType(View.LAYER_TYPE_SOFTWARE, null);
    }

    ReactAccessibilityDelegate editTextAccessibilityDelegate =
        new ReactAccessibilityDelegate(
            this, this.isFocusable(), this.getImportantForAccessibility()) {
          @Override
          public boolean performAccessibilityAction(View host, int action, Bundle args) {
            if (action == AccessibilityNodeInfo.ACTION_CLICK) {
              int length = getText().length();
              if (length > 0) {
                // For some reason, when you swipe to focus on a text input that already has text in
                // it, it clears the selection and resets the cursor to the beginning of the input.
                // Since this is not typically (ever?) what you want, let's just explicitly set the
                // selection on accessibility click to undo that.
                setSelection(length);
              }
              return requestFocusInternal();
            }
            return super.performAccessibilityAction(host, action, args);
          }
        };
    ViewCompat.setAccessibilityDelegate(this, editTextAccessibilityDelegate);
    ActionMode.Callback customActionModeCallback =
        new ActionMode.Callback() {
          /*
           * Editor onCreateActionMode adds the cut, copy, paste, share, autofill,
           * and paste as plain text items to the context menu.
           */
          @Override
          public boolean onCreateActionMode(ActionMode mode, Menu menu) {
            if (mContextMenuHidden) {
              return false;
            }
            menu.removeItem(android.R.id.pasteAsPlainText);
            return true;
          }

          @Override
          public boolean onPrepareActionMode(ActionMode mode, Menu menu) {
            return true;
          }

          @Override
          public boolean onActionItemClicked(ActionMode mode, MenuItem item) {
            return false;
          }

          @Override
          public void onDestroyActionMode(ActionMode mode) {}
        };
    setCustomSelectionActionModeCallback(customActionModeCallback);
    setCustomInsertionActionModeCallback(customActionModeCallback);
  }

  @Override
  protected void finalize() {
    if (DEBUG_MODE) {
      FLog.e(TAG, "finalize[" + getId() + "] delete cached spannable");
    }
    TextLayoutManager.deleteCachedSpannableForTag(getId());
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
    if (mSelectTextOnFocus && isFocused()) {
      // Explicitly call this method to select text when layout is drawn
      selectAll();
      // Prevent text on being selected for next layout pass
      mSelectTextOnFocus = false;
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
  public void setLineHeight(int lineHeight) {
    mTextAttributes.setLineHeight(lineHeight);
    // We don't call super.setLineHeight() because LineHeight is fully managed by ReactNative
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
          new ReactEditTextInputConnectionWrapper(
              inputConnection, reactContext, this, mEventDispatcher);
    }

    if (isMultiline() && (shouldBlurOnReturn() || shouldSubmitOnReturn())) {
      // Remove IME_FLAG_NO_ENTER_ACTION to keep the original IME_OPTION
      outAttrs.imeOptions &= ~EditorInfo.IME_FLAG_NO_ENTER_ACTION;
    }
    return inputConnection;
  }

  /*
   * Called when a context menu option for the text view is selected.
   * React Native replaces copy (as rich text) with copy as plain text.
   */
  @Override
  public boolean onTextContextMenuItem(int id) {
    if (id == android.R.id.paste) {
      id = android.R.id.pasteAsPlainText;
    }
    return super.onTextContextMenuItem(id);
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

  public void setContentSizeWatcher(@Nullable ContentSizeWatcher contentSizeWatcher) {
    mContentSizeWatcher = contentSizeWatcher;
  }

  public void setScrollWatcher(@Nullable ScrollWatcher scrollWatcher) {
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

    if (start != ReactConstants.UNSET && end != ReactConstants.UNSET) {
      // clamp selection values for safety
      start = clampToTextLength(start);
      end = clampToTextLength(end);

      setSelection(start, end);
    }
  }

  private int clampToTextLength(int value) {
    int textLength = getText() == null ? 0 : getText().length();

    return Math.max(0, Math.min(value, textLength));
  }

  @Override
  public void setSelection(int start, int end) {
    if (DEBUG_MODE) {
      FLog.e(TAG, "setSelection[" + getId() + "]: " + start + " " + end);
    }
    super.setSelection(start, end);
  }

  @Override
  protected void onSelectionChanged(int selStart, int selEnd) {
    if (DEBUG_MODE) {
      FLog.e(TAG, "onSelectionChanged[" + getId() + "]: " + selStart + " " + selEnd);
    }

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

  public void setSelectionWatcher(@Nullable SelectionWatcher selectionWatcher) {
    mSelectionWatcher = selectionWatcher;
  }

  public void setOnKeyPress(boolean onKeyPress) {
    mOnKeyPress = onKeyPress;
  }

  public boolean shouldBlurOnReturn() {
    String submitBehavior = getSubmitBehavior();
    boolean shouldBlur;

    // Default shouldBlur
    if (submitBehavior == null) {
      if (!isMultiline()) {
        shouldBlur = true;
      } else {
        shouldBlur = false;
      }
    } else {
      shouldBlur = submitBehavior.equals("blurAndSubmit");
    }

    return shouldBlur;
  }

  public boolean shouldSubmitOnReturn() {
    String submitBehavior = getSubmitBehavior();
    boolean shouldSubmit;

    // Default shouldSubmit
    if (submitBehavior == null) {
      if (!isMultiline()) {
        shouldSubmit = true;
      } else {
        shouldSubmit = false;
      }
    } else {
      shouldSubmit = submitBehavior.equals("submit") || submitBehavior.equals("blurAndSubmit");
    }

    return shouldSubmit;
  }

  public String getSubmitBehavior() {
    return mSubmitBehavior;
  }

  public void setSubmitBehavior(@Nullable String submitBehavior) {
    mSubmitBehavior = submitBehavior;
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
    if (mKeyListener == null) {
      mKeyListener = new InternalKeyListener();
    }

    mKeyListener.setInputType(type);
    setKeyListener(mKeyListener);
  }

  public void setPlaceholder(@Nullable String placeholder) {
    if (!Objects.equals(placeholder, mPlaceholder)) {
      mPlaceholder = placeholder;
      setHint(placeholder);
    }
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

  @Override
  public void setFontFeatureSettings(String fontFeatureSettings) {
    if (!Objects.equals(fontFeatureSettings, getFontFeatureSettings())) {
      super.setFontFeatureSettings(fontFeatureSettings);
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

    // Match behavior of CustomStyleSpan and enable SUBPIXEL_TEXT_FLAG when setting anything
    // nonstandard
    if (mFontStyle != ReactConstants.UNSET
        || mFontWeight != ReactConstants.UNSET
        || mFontFamily != null
        || getFontFeatureSettings() != null) {
      setPaintFlags(getPaintFlags() | Paint.SUBPIXEL_TEXT_FLAG);
    } else {
      setPaintFlags(getPaintFlags() & (~Paint.SUBPIXEL_TEXT_FLAG));
    }
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

    if (DEBUG_MODE) {
      FLog.e(
          TAG,
          "maybeSetText["
              + getId()
              + "]: current text: "
              + getText()
              + " update: "
              + reactTextUpdate.getText());
    }

    // The current text gets replaced with the text received from JS. However, the spans on the
    // current text need to be adapted to the new text. Since TextView#setText() will remove or
    // reset some of these spans even if they are set directly, SpannableStringBuilder#replace() is
    // used instead (this is also used by the keyboard implementation underneath the covers).
    SpannableStringBuilder spannableStringBuilder =
        new SpannableStringBuilder(reactTextUpdate.getText());

    manageSpans(spannableStringBuilder);
    stripStyleEquivalentSpans(spannableStringBuilder);

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

    if (getBreakStrategy() != reactTextUpdate.getTextBreakStrategy()) {
      setBreakStrategy(reactTextUpdate.getTextBreakStrategy());
    }

    // Update cached spans (in Fabric only).
    updateCachedSpannable();
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
      Object span = spans[spanIdx];
      int spanFlags = getText().getSpanFlags(span);
      boolean isExclusiveExclusive =
          (spanFlags & Spanned.SPAN_EXCLUSIVE_EXCLUSIVE) == Spanned.SPAN_EXCLUSIVE_EXCLUSIVE;

      // Remove all styling spans we might have previously set
      if (span instanceof ReactSpan) {
        getText().removeSpan(span);
      }

      // We only add spans back for EXCLUSIVE_EXCLUSIVE spans
      if (!isExclusiveExclusive) {
        continue;
      }

      final int spanStart = getText().getSpanStart(span);
      final int spanEnd = getText().getSpanEnd(span);

      // Make sure the span is removed from existing text, otherwise the spans we set will be
      // ignored or it will cover text that has changed.
      getText().removeSpan(span);
      if (sameTextForSpan(getText(), spannableStringBuilder, spanStart, spanEnd)) {
        spannableStringBuilder.setSpan(span, spanStart, spanEnd, spanFlags);
      }
    }
  }

  /**
   * Remove spans from the SpannableStringBuilder which can be represented by TextAppearance
   * attributes on the underlying EditText. This works around instability on Samsung devices with
   * the presence of spans https://github.com/facebook/react-native/issues/35936 (S318090)
   */
  private void stripStyleEquivalentSpans(SpannableStringBuilder sb) {
    stripSpansOfKind(
        sb,
        ReactAbsoluteSizeSpan.class,
        (span) -> span.getSize() == mTextAttributes.getEffectiveFontSize());

    stripSpansOfKind(
        sb,
        ReactBackgroundColorSpan.class,
        (span) -> span.getBackgroundColor() == mReactBackgroundManager.getBackgroundColor());

    stripSpansOfKind(
        sb,
        ReactForegroundColorSpan.class,
        (span) -> span.getForegroundColor() == getCurrentTextColor());

    stripSpansOfKind(
        sb,
        ReactStrikethroughSpan.class,
        (span) -> (getPaintFlags() & Paint.STRIKE_THRU_TEXT_FLAG) != 0);

    stripSpansOfKind(
        sb, ReactUnderlineSpan.class, (span) -> (getPaintFlags() & Paint.UNDERLINE_TEXT_FLAG) != 0);

    stripSpansOfKind(
        sb,
        CustomLetterSpacingSpan.class,
        (span) -> span.getSpacing() == mTextAttributes.getEffectiveLetterSpacing());

    stripSpansOfKind(
        sb,
        CustomStyleSpan.class,
        (span) -> {
          return span.getStyle() == mFontStyle
              && Objects.equals(span.getFontFamily(), mFontFamily)
              && span.getWeight() == mFontWeight
              && Objects.equals(span.getFontFeatureSettings(), getFontFeatureSettings());
        });
  }

  private <T> void stripSpansOfKind(
      SpannableStringBuilder sb, Class<T> clazz, Predicate<T> shouldStrip) {
    T[] spans = sb.getSpans(0, sb.length(), clazz);

    for (T span : spans) {
      if (shouldStrip.test(span)) {
        sb.removeSpan(span);
      }
    }
  }

  /**
   * Copy styles represented as attributes to the underlying span, for later measurement or other
   * usage outside the ReactEditText.
   */
  private void addSpansFromStyleAttributes(SpannableStringBuilder workingText) {
    int spanFlags = Spannable.SPAN_INCLUSIVE_INCLUSIVE;

    // Set all bits for SPAN_PRIORITY so that this span has the highest possible priority
    // (least precedence). This ensures the span is behind any overlapping spans.
    spanFlags |= Spannable.SPAN_PRIORITY;

    workingText.setSpan(
        new ReactAbsoluteSizeSpan(mTextAttributes.getEffectiveFontSize()),
        0,
        workingText.length(),
        spanFlags);

    workingText.setSpan(
        new ReactForegroundColorSpan(getCurrentTextColor()), 0, workingText.length(), spanFlags);

    int backgroundColor = mReactBackgroundManager.getBackgroundColor();
    if (backgroundColor != Color.TRANSPARENT) {
      workingText.setSpan(
          new ReactBackgroundColorSpan(backgroundColor), 0, workingText.length(), spanFlags);
    }

    if ((getPaintFlags() & Paint.STRIKE_THRU_TEXT_FLAG) != 0) {
      workingText.setSpan(new ReactStrikethroughSpan(), 0, workingText.length(), spanFlags);
    }

    if ((getPaintFlags() & Paint.UNDERLINE_TEXT_FLAG) != 0) {
      workingText.setSpan(new ReactUnderlineSpan(), 0, workingText.length(), spanFlags);
    }

    float effectiveLetterSpacing = mTextAttributes.getEffectiveLetterSpacing();
    if (!Float.isNaN(effectiveLetterSpacing)) {
      workingText.setSpan(
          new CustomLetterSpacingSpan(effectiveLetterSpacing), 0, workingText.length(), spanFlags);
    }

    if (mFontStyle != ReactConstants.UNSET
        || mFontWeight != ReactConstants.UNSET
        || mFontFamily != null
        || getFontFeatureSettings() != null) {
      workingText.setSpan(
          new CustomStyleSpan(
              mFontStyle,
              mFontWeight,
              getFontFeatureSettings(),
              mFontFamily,
              getContext().getAssets()),
          0,
          workingText.length(),
          spanFlags);
    }

    float lineHeight = mTextAttributes.getEffectiveLineHeight();
    if (!Float.isNaN(lineHeight)) {
      workingText.setSpan(new CustomLineHeightSpan(lineHeight), 0, workingText.length(), spanFlags);
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
    ReactContext reactContext = getReactContext(this);

    if (mStateWrapper == null && !reactContext.isBridgeless()) {

      final ReactTextInputLocalData localData = new ReactTextInputLocalData(this);
      UIManagerModule uiManager = reactContext.getNativeModule(UIManagerModule.class);
      if (uiManager != null) {
        uiManager.setViewLocalData(getId(), localData);
      }
    }
  }

  /* package */ int getGravityHorizontal() {
    return getGravity()
        & (Gravity.HORIZONTAL_GRAVITY_MASK | Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK);
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

    // Used to ensure that text is selectable inside of removeClippedSubviews
    // See https://github.com/facebook/react-native/issues/6805 for original
    // fix that was ported to here.

    super.setTextIsSelectable(true);

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
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBackgroundColor(this, color);
    } else {
      mReactBackgroundManager.setBackgroundColor(color);
    }
  }

  public void setBorderWidth(int position, float width) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderWidth(
          this, LogicalEdge.values()[position], PixelUtil.toDIPFromPixel(width));
    } else {
      mReactBackgroundManager.setBorderWidth(position, width);
    }
  }

  public void setBorderColor(int position, @Nullable Integer color) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderColor(this, LogicalEdge.values()[position], color);
    } else {
      mReactBackgroundManager.setBorderColor(position, color);
    }
  }

  public int getBorderColor(int position) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      @Nullable
      Integer borderColor =
          BackgroundStyleApplicator.getBorderColor(this, LogicalEdge.values()[position]);
      return borderColor == null ? Color.TRANSPARENT : borderColor;
    } else {
      return mReactBackgroundManager.getBorderColor(position);
    }
  }

  public void setBorderRadius(float borderRadius) {
    setBorderRadius(borderRadius, BorderRadiusProp.BORDER_RADIUS.ordinal());
  }

  public void setBorderRadius(float borderRadius, int position) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      @Nullable
      LengthPercentage radius =
          Float.isNaN(borderRadius)
              ? null
              : new LengthPercentage(
                  PixelUtil.toDIPFromPixel(borderRadius), LengthPercentageType.POINT);
      BackgroundStyleApplicator.setBorderRadius(this, BorderRadiusProp.values()[position], radius);
    } else {
      mReactBackgroundManager.setBorderRadius(borderRadius, position);
    }
  }

  public void setBorderStyle(@Nullable String style) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderStyle(
          this, style == null ? null : BorderStyle.fromString(style));
    } else {
      mReactBackgroundManager.setBorderStyle(style);
    }
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

  public void setSelectTextOnFocus(boolean selectTextOnFocus) {
    super.setSelectAllOnFocus(selectTextOnFocus);
    mSelectTextOnFocus = selectTextOnFocus;
  }

  public void setContextMenuHidden(boolean contextMenuHidden) {
    mContextMenuHidden = contextMenuHidden;
  }

  protected void applyTextAttributes() {
    // In general, the `getEffective*` functions return `Float.NaN` if the
    // property hasn't been set.

    // `getEffectiveFontSize` always returns a value so don't need to check for anything like
    // `Float.NaN`.
    setTextSize(TypedValue.COMPLEX_UNIT_PX, mTextAttributes.getEffectiveFontSize());

    float effectiveLetterSpacing = mTextAttributes.getEffectiveLetterSpacing();
    if (!Float.isNaN(effectiveLetterSpacing)) {
      setLetterSpacing(effectiveLetterSpacing);
    }
  }

  @Nullable
  public StateWrapper getStateWrapper() {
    return mStateWrapper;
  }

  public void setStateWrapper(StateWrapper stateWrapper) {
    mStateWrapper = stateWrapper;
  }

  /**
   * Update the cached Spannable used in TextLayoutManager to measure the text in Fabric. This is
   * mostly copied from ReactTextInputShadowNode.java (the non-Fabric version) and
   * TextLayoutManager.java with some very minor modifications. There's some duplication between
   * here and TextLayoutManager, so there might be an opportunity for refactor.
   */
  private void updateCachedSpannable() {
    // Noops in non-Fabric
    if (mStateWrapper == null) {
      return;
    }
    // If this view doesn't have an ID yet, we don't have a cache key, so bail here
    if (getId() == -1) {
      return;
    }

    Editable currentText = getText();
    boolean haveText = currentText != null && currentText.length() > 0;

    SpannableStringBuilder sb = new SpannableStringBuilder();

    // A note of caution: appending currentText to sb appends all the spans of currentText - not
    // copies of the Spans, but the actual span objects. Any modifications to sb after that point
    // can modify the spans of sb/currentText, impact the text or spans visible on screen, and
    // also call the TextChangeWatcher methods.
    if (haveText) {
      // This is here as a workaround for T76236115, which looks like this:
      // Hopefully we can delete all this stuff if we can get rid of the soft errors.
      // - android.text.SpannableStringBuilder.charAt (SpannableStringBuilder.java:123)
      // - android.text.CharSequenceCharacterIterator.current
      // (CharSequenceCharacterIterator.java:58)
      // - android.text.CharSequenceCharacterIterator.setIndex
      // (CharSequenceCharacterIterator.java:83)
      // - android.icu.text.RuleBasedBreakIterator.CISetIndex32 (RuleBasedBreakIterator.java:1126)
      // - android.icu.text.RuleBasedBreakIterator.isBoundary (RuleBasedBreakIterator.java:503)
      // - android.text.method.WordIterator.isBoundary (WordIterator.java:95)
      // - android.widget.Editor$SelectionHandleView.positionAtCursorOffset (Editor.java:6666)
      // - android.widget.Editor$HandleView.invalidate (Editor.java:5241)
      // - android.widget.Editor$SelectionModifierCursorController.invalidateHandles
      // (Editor.java:7442)
      // - android.widget.Editor.invalidateHandlesAndActionMode (Editor.java:2112)
      // - android.widget.TextView.spanChange (TextView.java:11189)
      // - android.widget.TextView$ChangeWatcher.onSpanAdded (TextView.java:14189)
      // - android.text.SpannableStringBuilder.sendSpanAdded (SpannableStringBuilder.java:1283)
      // - android.text.SpannableStringBuilder.sendToSpanWatchers (SpannableStringBuilder.java:663)
      // - android.text.SpannableStringBuilder.replace (SpannableStringBuilder.java:579)
      // - android.text.SpannableStringBuilder.append (SpannableStringBuilder.java:269)
      // - ReactEditText.updateCachedSpannable (ReactEditText.java:995)
      // - ReactEditText$TextWatcherDelegator.onTextChanged (ReactEditText.java:1044)
      // - android.widget.TextView.sendOnTextChanged (TextView.java:10972)
      // ...
      // - android.text.method.BaseKeyListener.onKeyDown (BaseKeyListener.java:479)
      // - android.text.method.QwertyKeyListener.onKeyDown (QwertyKeyListener.java:362)
      // - ReactEditText$InternalKeyListener.onKeyDown (ReactEditText.java:1094)
      // ...
      // - android.app.Activity.dispatchKeyEvent (Activity.java:3447)
      try {
        sb.append(currentText.subSequence(0, currentText.length()));
      } catch (IndexOutOfBoundsException e) {
        ReactSoftExceptionLogger.logSoftException(TAG, e);
      }
    }

    // If we don't have text, make sure we have *something* to measure.
    // Hint has the same dimensions - the only thing that's different is background or foreground
    // color
    if (!haveText) {
      if (getHint() != null && getHint().length() > 0) {
        sb.append(getHint());
      } else {
        // Measure something so we have correct height, even if there's no string.
        sb.append("I");
      }
    }

    addSpansFromStyleAttributes(sb);
    TextLayoutManager.setCachedSpannableForTag(getId(), sb);
  }

  void setEventDispatcher(@Nullable EventDispatcher eventDispatcher) {
    mEventDispatcher = eventDispatcher;
  }

  public void setOverflow(@Nullable String overflow) {
    if (overflow == null) {
      mOverflow = Overflow.VISIBLE;
    } else {
      @Nullable Overflow parsedOverflow = Overflow.fromString(overflow);
      mOverflow = parsedOverflow == null ? Overflow.VISIBLE : parsedOverflow;
    }

    mReactBackgroundManager.setOverflow(overflow);
    invalidate();
  }

  @Override
  public void onDraw(Canvas canvas) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      if (mOverflow != Overflow.VISIBLE) {
        BackgroundStyleApplicator.clipToPaddingBox(this, canvas);
      }
    } else {
      mReactBackgroundManager.maybeClipToPaddingBox(canvas);
    }

    super.onDraw(canvas);
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
      if (DEBUG_MODE) {
        FLog.e(
            TAG, "onTextChanged[" + getId() + "]: " + s + " " + start + " " + before + " " + count);
      }

      if (!mIsSettingTextFromJS && mListeners != null) {
        for (TextWatcher listener : mListeners) {
          listener.onTextChanged(s, start, before, count);
        }
      }

      updateCachedSpannable();

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

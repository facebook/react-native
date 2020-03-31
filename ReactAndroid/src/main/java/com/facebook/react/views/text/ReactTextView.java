/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import static com.facebook.react.views.text.TextAttributeProps.UNSET;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.text.Layout;
import android.text.Spannable;
import android.text.Spanned;
import android.text.TextUtils;
import android.text.method.LinkMovementMethod;
import android.text.util.Linkify;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatTextView;
import androidx.appcompat.widget.TintContextWrapper;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactCompoundView;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.react.views.view.ReactViewBackgroundManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;

public class ReactTextView extends AppCompatTextView implements ReactCompoundView {

  private static final ViewGroup.LayoutParams EMPTY_LAYOUT_PARAMS =
      new ViewGroup.LayoutParams(0, 0);

  private boolean mContainsImages;
  private int mDefaultGravityHorizontal;
  private int mDefaultGravityVertical;
  private int mTextAlign = Gravity.NO_GRAVITY;
  private int mNumberOfLines = ViewDefaults.NUMBER_OF_LINES;
  private TextUtils.TruncateAt mEllipsizeLocation = TextUtils.TruncateAt.END;
  private boolean mAdjustsFontSizeToFit = false;
  private int mLinkifyMaskType = 0;
  private boolean mNotifyOnInlineViewLayout;

  private ReactViewBackgroundManager mReactBackgroundManager;
  private Spannable mSpanned;

  public ReactTextView(Context context) {
    super(context);
    mReactBackgroundManager = new ReactViewBackgroundManager(this);
    mDefaultGravityHorizontal =
        getGravity() & (Gravity.HORIZONTAL_GRAVITY_MASK | Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK);
    mDefaultGravityVertical = getGravity() & Gravity.VERTICAL_GRAVITY_MASK;
  }

  private static WritableMap inlineViewJson(
      int visibility, int index, int left, int top, int right, int bottom) {
    WritableMap json = Arguments.createMap();
    if (visibility == View.GONE) {
      json.putString("visibility", "gone");
      json.putInt("index", index);
    } else if (visibility == View.VISIBLE) {
      json.putString("visibility", "visible");
      json.putInt("index", index);
      json.putDouble("left", PixelUtil.toDIPFromPixel(left));
      json.putDouble("top", PixelUtil.toDIPFromPixel(top));
      json.putDouble("right", PixelUtil.toDIPFromPixel(right));
      json.putDouble("bottom", PixelUtil.toDIPFromPixel(bottom));
    } else {
      json.putString("visibility", "unknown");
      json.putInt("index", index);
    }
    return json;
  }

  private ReactContext getReactContext() {
    Context context = getContext();
    return (context instanceof TintContextWrapper)
        ? (ReactContext) ((TintContextWrapper) context).getBaseContext()
        : (ReactContext) context;
  }

  @Override
  protected void onLayout(
      boolean changed, int textViewLeft, int textViewTop, int textViewRight, int textViewBottom) {
    // TODO T62882314: Delete this method when Fabric is fully released in OSS
    if (!(getText() instanceof Spanned)
        || ViewUtil.getUIManagerType(getId()) == UIManagerType.FABRIC) {
      /**
       * In general, {@link #setText} is called via {@link ReactTextViewManager#updateExtraData}
       * before we are laid out. This ordering is a requirement because we utilize the data from
       * setText in onLayout.
       *
       * <p>However, it's possible for us to get an extra layout before we've received our setText
       * call. If this happens before the initial setText call, then getText() will have its default
       * value which isn't a Spanned and we need to bail out. That's fine because we'll get a
       * setText followed by a layout later.
       *
       * <p>The cause for the extra early layout is that an ancestor gets transitioned from a
       * layout-only node to a non layout-only node.
       */
      return;
    }

    ReactContext reactContext = getReactContext();
    UIManagerModule uiManager = reactContext.getNativeModule(UIManagerModule.class);

    Spanned text = (Spanned) getText();
    Layout layout = getLayout();
    TextInlineViewPlaceholderSpan[] placeholders =
        text.getSpans(0, text.length(), TextInlineViewPlaceholderSpan.class);
    ArrayList inlineViewInfoArray =
        mNotifyOnInlineViewLayout ? new ArrayList(placeholders.length) : null;
    int textViewWidth = textViewRight - textViewLeft;
    int textViewHeight = textViewBottom - textViewTop;

    for (TextInlineViewPlaceholderSpan placeholder : placeholders) {
      View child = uiManager.resolveView(placeholder.getReactTag());

      int start = text.getSpanStart(placeholder);
      int line = layout.getLineForOffset(start);
      boolean isLineTruncated = layout.getEllipsisCount(line) > 0;

      if ( // This truncation check works well on recent versions of Android (tested on 5.1.1 and
      // 6.0.1) but not on Android 4.4.4. The reason is that getEllipsisCount is buggy on
      // Android 4.4.4. Specifically, it incorrectly returns 0 if an inline view is the first
      // thing to be truncated.
      (isLineTruncated && start >= layout.getLineStart(line) + layout.getEllipsisStart(line))
          ||

          // This truncation check works well on Android 4.4.4 but not on others (e.g. 6.0.1).
          // On Android 4.4.4, getLineEnd returns the first truncated character whereas on 6.0.1,
          // it appears to return the position after the last character on the line even if that
          // character is truncated.
          line >= mNumberOfLines
          || start >= layout.getLineEnd(line)) {
        // On some versions of Android (e.g. 4.4.4, 5.1.1), getPrimaryHorizontal can infinite
        // loop when called on a character that appears after the ellipsis. Avoid this bug by
        // special casing the character truncation case.
        child.setVisibility(View.GONE);
        if (mNotifyOnInlineViewLayout) {
          inlineViewInfoArray.add(inlineViewJson(View.GONE, start, -1, -1, -1, -1));
        }
      } else {
        int width = placeholder.getWidth();
        int height = placeholder.getHeight();

        // Calculate if the direction of the placeholder character is Right-To-Left.
        boolean isRtlChar = layout.isRtlCharAt(start);

        boolean isRtlParagraph = layout.getParagraphDirection(line) == Layout.DIR_RIGHT_TO_LEFT;

        int placeholderHorizontalPosition;
        // There's a bug on Samsung devices where calling getPrimaryHorizontal on
        // the last offset in the layout will result in an endless loop. Work around
        // this bug by avoiding getPrimaryHorizontal in that case.
        if (start == text.length() - 1) {
          placeholderHorizontalPosition =
              isRtlParagraph
                  // Equivalent to `layout.getLineLeft(line)` but `getLineLeft` returns incorrect
                  // values when the paragraph is RTL and `setSingleLine(true)`.
                  ? textViewWidth - (int) layout.getLineWidth(line)
                  : (int) layout.getLineRight(line) - width;
        } else {
          // The direction of the paragraph may not be exactly the direction the string is heading
          // in at the
          // position of the placeholder. So, if the direction of the character is the same as the
          // paragraph
          // use primary, secondary otherwise.
          boolean characterAndParagraphDirectionMatch = isRtlParagraph == isRtlChar;

          placeholderHorizontalPosition =
              characterAndParagraphDirectionMatch
                  ? (int) layout.getPrimaryHorizontal(start)
                  : (int) layout.getSecondaryHorizontal(start);

          if (isRtlParagraph) {
            // Adjust `placeholderHorizontalPosition` to work around an Android bug.
            // The bug is when the paragraph is RTL and `setSingleLine(true)`, some layout
            // methods such as `getPrimaryHorizontal`, `getSecondaryHorizontal`, and
            // `getLineRight` return incorrect values. Their return values seem to be off
            // by the same number of pixels so subtracting these values cancels out the error.
            //
            // The result is equivalent to bugless versions of
            // `getPrimaryHorizontal`/`getSecondaryHorizontal`.
            placeholderHorizontalPosition =
                textViewWidth - ((int) layout.getLineRight(line) - placeholderHorizontalPosition);
          }

          if (isRtlChar) {
            placeholderHorizontalPosition -= width;
          }
        }

        int leftRelativeToTextView =
            isRtlChar
                ? placeholderHorizontalPosition + getTotalPaddingRight()
                : placeholderHorizontalPosition + getTotalPaddingLeft();

        int left = textViewLeft + leftRelativeToTextView;

        // Vertically align the inline view to the baseline of the line of text.
        int topRelativeToTextView = getTotalPaddingTop() + layout.getLineBaseline(line) - height;
        int top = textViewTop + topRelativeToTextView;

        boolean isFullyClipped =
            textViewWidth <= leftRelativeToTextView || textViewHeight <= topRelativeToTextView;
        int layoutVisibility = isFullyClipped ? View.GONE : View.VISIBLE;
        int layoutLeft = left;
        int layoutTop = top;
        int layoutRight = left + width;
        int layoutBottom = top + height;

        // Keep these parameters in sync with what goes into `inlineViewInfoArray`.
        child.setVisibility(layoutVisibility);
        child.layout(layoutLeft, layoutTop, layoutRight, layoutBottom);
        if (mNotifyOnInlineViewLayout) {
          inlineViewInfoArray.add(
              inlineViewJson(
                  layoutVisibility, start, layoutLeft, layoutTop, layoutRight, layoutBottom));
        }
      }
    }

    if (mNotifyOnInlineViewLayout) {
      Collections.sort(
          inlineViewInfoArray,
          new Comparator() {
            @Override
            public int compare(Object o1, Object o2) {
              WritableMap m1 = (WritableMap) o1;
              WritableMap m2 = (WritableMap) o2;
              return m1.getInt("index") - m2.getInt("index");
            }
          });
      WritableArray inlineViewInfoArray2 = Arguments.createArray();
      for (Object item : inlineViewInfoArray) {
        inlineViewInfoArray2.pushMap((WritableMap) item);
      }

      WritableMap event = Arguments.createMap();
      event.putArray("inlineViews", inlineViewInfoArray2);
      reactContext
          .getJSModule(RCTEventEmitter.class)
          .receiveEvent(getId(), "topInlineViewLayout", event);
    }
  }

  public void setText(ReactTextUpdate update) {
    mContainsImages = update.containsImages();
    // Android's TextView crashes when it tries to relayout if LayoutParams are
    // null; explicitly set the LayoutParams to prevent this crash. See:
    // https://github.com/facebook/react-native/pull/7011
    if (getLayoutParams() == null) {
      setLayoutParams(EMPTY_LAYOUT_PARAMS);
    }
    Spannable spannable = update.getText();
    if (mLinkifyMaskType > 0) {
      Linkify.addLinks(spannable, mLinkifyMaskType);
      setMovementMethod(LinkMovementMethod.getInstance());
    }
    setText(spannable);
    float paddingLeft = update.getPaddingLeft();
    float paddingTop = update.getPaddingTop();
    float paddingRight = update.getPaddingRight();
    float paddingBottom = update.getPaddingBottom();

    // In Fabric padding is set by the update of Layout Metrics and not as part of the "setText"
    // operation
    // TODO T56559197: remove this condition when we migrate 100% to Fabric
    if (paddingLeft != UNSET
        && paddingBottom != UNSET
        && paddingRight != UNSET
        && paddingBottom != UNSET) {

      setPadding(
          (int) Math.floor(paddingLeft),
          (int) Math.floor(paddingTop),
          (int) Math.floor(paddingRight),
          (int) Math.floor(paddingBottom));
    }

    int nextTextAlign = update.getTextAlign();
    if (mTextAlign != nextTextAlign) {
      mTextAlign = nextTextAlign;
    }
    setGravityHorizontal(mTextAlign);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (getBreakStrategy() != update.getTextBreakStrategy()) {
        setBreakStrategy(update.getTextBreakStrategy());
      }
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      if (getJustificationMode() != update.getJustificationMode()) {
        setJustificationMode(update.getJustificationMode());
      }
    }

    // Ensure onLayout is called so the inline views can be repositioned.
    requestLayout();
  }

  @Override
  public int reactTagForTouch(float touchX, float touchY) {
    CharSequence text = getText();
    int target = getId();

    int x = (int) touchX;
    int y = (int) touchY;

    Layout layout = getLayout();
    if (layout == null) {
      // If the layout is null, the view hasn't been properly laid out yet. Therefore, we can't find
      // the exact text tag that has been touched, and the correct tag to return is the default one.
      return target;
    }
    int line = layout.getLineForVertical(y);

    int lineStartX = (int) layout.getLineLeft(line);
    int lineEndX = (int) layout.getLineRight(line);

    // TODO(5966918): Consider extending touchable area for text spans by some DP constant
    if (text instanceof Spanned && x >= lineStartX && x <= lineEndX) {
      Spanned spannedText = (Spanned) text;
      int index = -1;
      try {
        index = layout.getOffsetForHorizontal(line, x);
      } catch (ArrayIndexOutOfBoundsException e) {
        // https://issuetracker.google.com/issues/113348914
        FLog.e(ReactConstants.TAG, "Crash in HorizontalMeasurementProvider: " + e.getMessage());
        return target;
      }

      // We choose the most inner span (shortest) containing character at the given index
      // if no such span can be found we will send the textview's react id as a touch handler
      // In case when there are more than one spans with same length we choose the last one
      // from the spans[] array, since it correspond to the most inner react element
      ReactTagSpan[] spans = spannedText.getSpans(index, index, ReactTagSpan.class);

      if (spans != null) {
        int targetSpanTextLength = text.length();
        for (int i = 0; i < spans.length; i++) {
          int spanStart = spannedText.getSpanStart(spans[i]);
          int spanEnd = spannedText.getSpanEnd(spans[i]);
          if (spanEnd > index && (spanEnd - spanStart) <= targetSpanTextLength) {
            target = spans[i].getReactTag();
            targetSpanTextLength = (spanEnd - spanStart);
          }
        }
      }
    }

    return target;
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
  public boolean hasOverlappingRendering() {
    return false;
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

  public void setNumberOfLines(int numberOfLines) {
    mNumberOfLines = numberOfLines == 0 ? ViewDefaults.NUMBER_OF_LINES : numberOfLines;
    setSingleLine(mNumberOfLines == 1);
    setMaxLines(mNumberOfLines);
  }

  public void setAdjustFontSizeToFit(boolean adjustsFontSizeToFit) {
    mAdjustsFontSizeToFit = adjustsFontSizeToFit;
  }

  public void setEllipsizeLocation(TextUtils.TruncateAt ellipsizeLocation) {
    mEllipsizeLocation = ellipsizeLocation;
  }

  public void setNotifyOnInlineViewLayout(boolean notifyOnInlineViewLayout) {
    mNotifyOnInlineViewLayout = notifyOnInlineViewLayout;
  }

  public void updateView() {
    @Nullable
    TextUtils.TruncateAt ellipsizeLocation =
        mNumberOfLines == ViewDefaults.NUMBER_OF_LINES || mAdjustsFontSizeToFit
            ? null
            : mEllipsizeLocation;
    setEllipsize(ellipsizeLocation);
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

  public void setSpanned(Spannable spanned) {
    mSpanned = spanned;
  }

  public Spannable getSpanned() {
    return mSpanned;
  }

  public void setLinkifyMask(int mask) {
    mLinkifyMaskType = mask;
  }
}

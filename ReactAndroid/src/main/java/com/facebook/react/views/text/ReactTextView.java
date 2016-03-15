/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.text.Layout;
import android.text.Spanned;
import android.view.Gravity;
import android.widget.TextView;

import com.facebook.react.uimanager.ReactCompoundView;

public class ReactTextView extends TextView implements ReactCompoundView {

  private boolean mContainsImages;
  private int mDefaultGravityHorizontal;
  private int mDefaultGravityVertical;

  public ReactTextView(Context context) {
    super(context);
    mDefaultGravityHorizontal =
      getGravity() & (Gravity.HORIZONTAL_GRAVITY_MASK | Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK);
    mDefaultGravityVertical = getGravity() & Gravity.VERTICAL_GRAVITY_MASK;
  }

  public void setText(ReactTextUpdate update) {
    mContainsImages = update.containsImages();
    setText(update.getText());
  }

  @Override
  public int reactTagForTouch(float touchX, float touchY) {
    Spanned text = (Spanned) getText();
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
    if (x >= lineStartX && x <= lineEndX) {
      int index = layout.getOffsetForHorizontal(line, x);

      // We choose the most inner span (shortest) containing character at the given index
      // if no such span can be found we will send the textview's react id as a touch handler
      // In case when there are more than one spans with same length we choose the last one
      // from the spans[] array, since it correspond to the most inner react element
      ReactTagSpan[] spans = text.getSpans(index, index, ReactTagSpan.class);

      if (spans != null) {
        int targetSpanTextLength = text.length();
        for (int i = 0; i < spans.length; i++) {
          int spanStart = text.getSpanStart(spans[i]);
          int spanEnd = text.getSpanEnd(spans[i]);
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
}

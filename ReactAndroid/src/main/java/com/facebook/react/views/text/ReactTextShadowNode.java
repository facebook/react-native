/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.os.Build;
import android.text.BoringLayout;
import android.text.Layout;
import android.text.Spannable;
import android.text.Spanned;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.view.Gravity;
import android.widget.TextView;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.yoga.YogaConstants;
import com.facebook.yoga.YogaDirection;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureOutput;
import com.facebook.yoga.YogaNode;
import javax.annotation.Nullable;

/**
 * {@link ReactBaseTextShadowNode} concrete class for anchor {@code Text} node.
 *
 * <p>The class measures text in {@code <Text>} view and feeds native {@link TextView} using {@code
 * Spannable} object constructed in superclass.
 */
public class ReactTextShadowNode extends ReactBaseTextShadowNode {

  // It's important to pass the ANTI_ALIAS_FLAG flag to the constructor rather than setting it
  // later by calling setFlags. This is because the latter approach triggers a bug on Android 4.4.2.
  // The bug is that unicode emoticons aren't measured properly which causes text to be clipped.
  private static final TextPaint sTextPaintInstance = new TextPaint(TextPaint.ANTI_ALIAS_FLAG);

  private @Nullable Spannable mPreparedSpannableText;

  private final YogaMeasureFunction mTextMeasureFunction =
      new YogaMeasureFunction() {
        @Override
        public long measure(
            YogaNode node,
            float width,
            YogaMeasureMode widthMode,
            float height,
            YogaMeasureMode heightMode) {
          // TODO(5578671): Handle text direction (see View#getTextDirectionHeuristic)
          TextPaint textPaint = sTextPaintInstance;
          Layout layout;
          Spanned text = Assertions.assertNotNull(
              mPreparedSpannableText,
              "Spannable element has not been prepared in onBeforeLayout");
          BoringLayout.Metrics boring = BoringLayout.isBoring(text, textPaint);
          float desiredWidth = boring == null ?
              Layout.getDesiredWidth(text, textPaint) : Float.NaN;

          // technically, width should never be negative, but there is currently a bug in
          boolean unconstrainedWidth = widthMode == YogaMeasureMode.UNDEFINED || width < 0;

          if (boring == null &&
              (unconstrainedWidth ||
                  (!YogaConstants.isUndefined(desiredWidth) && desiredWidth <= width))) {
            // Is used when the width is not known and the text is not boring, ie. if it contains
            // unicode characters.

            int hintWidth = (int) Math.ceil(desiredWidth);
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
              layout = new StaticLayout(
                text,
                textPaint,
                hintWidth,
                Layout.Alignment.ALIGN_NORMAL,
                1.f,
                0.f,
                mIncludeFontPadding);
            } else {
              layout = StaticLayout.Builder.obtain(text, 0, text.length(), textPaint, hintWidth)
                .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .setLineSpacing(0.f, 1.f)
                .setIncludePad(mIncludeFontPadding)
                .setBreakStrategy(mTextBreakStrategy)
                .setHyphenationFrequency(Layout.HYPHENATION_FREQUENCY_NORMAL)
                .build();
            }

          } else if (boring != null && (unconstrainedWidth || boring.width <= width)) {
            // Is used for single-line, boring text when the width is either unknown or bigger
            // than the width of the text.
            layout = BoringLayout.make(
                text,
                textPaint,
                boring.width,
                Layout.Alignment.ALIGN_NORMAL,
                1.f,
                0.f,
                boring,
                mIncludeFontPadding);
          } else {
            // Is used for multiline, boring text and the width is known.

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
              layout = new StaticLayout(
                  text,
                  textPaint,
                  (int) width,
                  Layout.Alignment.ALIGN_NORMAL,
                  1.f,
                  0.f,
                  mIncludeFontPadding);
            } else {
              layout = StaticLayout.Builder.obtain(text, 0, text.length(), textPaint, (int) width)
                .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .setLineSpacing(0.f, 1.f)
                .setIncludePad(mIncludeFontPadding)
                .setBreakStrategy(mTextBreakStrategy)
                .setHyphenationFrequency(Layout.HYPHENATION_FREQUENCY_NORMAL)
                .build();
            }
          }

          if (mNumberOfLines != UNSET &&
              mNumberOfLines < layout.getLineCount()) {
            return YogaMeasureOutput.make(
                layout.getWidth(),
                layout.getLineBottom(mNumberOfLines - 1));
          } else {
            return YogaMeasureOutput.make(layout.getWidth(), layout.getHeight());
          }
        }
      };

  public ReactTextShadowNode() {
    initMeasureFunction();
  }

  private ReactTextShadowNode(ReactTextShadowNode node) {
    super(node);
    this.mPreparedSpannableText = node.mPreparedSpannableText;
  }

  private void initMeasureFunction() {
    if (!isVirtual()) {
      setMeasureFunction(mTextMeasureFunction);
    }
  }

  @Override
  protected LayoutShadowNode copy() {
    return new ReactTextShadowNode(this);
  }

  @Override
  public ReactShadowNodeImpl mutableCopy(long instanceHandle) {
    ReactTextShadowNode copy = (ReactTextShadowNode) super.mutableCopy(instanceHandle);
    copy.initMeasureFunction();
    return copy;
  }

  @Override
  public ReactShadowNodeImpl mutableCopyWithNewChildren(long instanceHandle) {
    ReactTextShadowNode copy = (ReactTextShadowNode) super.mutableCopyWithNewChildren(instanceHandle);
    copy.initMeasureFunction();
    return copy;
  }

  // Return text alignment according to LTR or RTL style
  private int getTextAlign() {
    int textAlign = mTextAlign;
    if (getLayoutDirection() == YogaDirection.RTL) {
      if (textAlign == Gravity.RIGHT) {
        textAlign = Gravity.LEFT;
      } else if (textAlign == Gravity.LEFT) {
        textAlign = Gravity.RIGHT;
      }
    }
    return textAlign;
  }

  @Override
  public void onBeforeLayout() {
    mPreparedSpannableText = spannedFromShadowNode(this, null);
    markUpdated();
  }

  @Override
  public boolean isVirtualAnchor() {
    return true;
  }

  @Override
  public void markUpdated() {
    super.markUpdated();
    // Telling to Yoga that the node should be remeasured on next layout pass.
    super.dirty();
  }

  @Override
  public void onCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue) {
    super.onCollectExtraUpdates(uiViewOperationQueue);

    if (mPreparedSpannableText != null) {
      ReactTextUpdate reactTextUpdate =
        new ReactTextUpdate(
          mPreparedSpannableText,
          UNSET,
          mContainsImages,
          getPadding(Spacing.START),
          getPadding(Spacing.TOP),
          getPadding(Spacing.END),
          getPadding(Spacing.BOTTOM),
          getTextAlign(),
          mTextBreakStrategy
        );
      uiViewOperationQueue.enqueueUpdateExtraData(getReactTag(), reactTextUpdate);
    }
  }
}

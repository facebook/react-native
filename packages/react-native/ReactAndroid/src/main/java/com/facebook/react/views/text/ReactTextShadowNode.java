/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.NativeViewHierarchyOptimizer;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.react.views.text.internal.span.ReactAbsoluteSizeSpan;
import com.facebook.react.views.text.internal.span.TextInlineViewPlaceholderSpan;
import com.facebook.yoga.YogaBaselineFunction;
import com.facebook.yoga.YogaConstants;
import com.facebook.yoga.YogaDirection;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureOutput;
import com.facebook.yoga.YogaNode;
import java.util.ArrayList;

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

  private boolean mShouldNotifyOnTextLayout;

  private final YogaMeasureFunction mTextMeasureFunction =
      new YogaMeasureFunction() {
        @Override
        public long measure(
            YogaNode node,
            float width,
            YogaMeasureMode widthMode,
            float height,
            YogaMeasureMode heightMode) {
          Spannable text =
              Assertions.assertNotNull(
                  mPreparedSpannableText,
                  "Spannable element has not been prepared in onBeforeLayout");

          Layout layout = measureSpannedText(text, width, widthMode);

          if (mAdjustsFontSizeToFit) {
            int initialFontSize = mTextAttributes.getEffectiveFontSize();
            int currentFontSize = mTextAttributes.getEffectiveFontSize();
            // Minimum font size is 4pts to match the iOS implementation.
            int minimumFontSize =
                (int) Math.max(mMinimumFontScale * initialFontSize, PixelUtil.toPixelFromDIP(4));
            while (currentFontSize > minimumFontSize
                && (mNumberOfLines != ReactConstants.UNSET && layout.getLineCount() > mNumberOfLines
                    || heightMode != YogaMeasureMode.UNDEFINED && layout.getHeight() > height)) {
              // TODO: We could probably use a smarter algorithm here. This will require 0(n)
              // measurements
              // based on the number of points the font size needs to be reduced by.
              currentFontSize -= Math.max(1, (int) PixelUtil.toPixelFromDIP(1));

              float ratio = (float) currentFontSize / (float) initialFontSize;
              ReactAbsoluteSizeSpan[] sizeSpans =
                  text.getSpans(0, text.length(), ReactAbsoluteSizeSpan.class);
              for (ReactAbsoluteSizeSpan span : sizeSpans) {
                text.setSpan(
                    new ReactAbsoluteSizeSpan(
                        (int) Math.max((span.getSize() * ratio), minimumFontSize)),
                    text.getSpanStart(span),
                    text.getSpanEnd(span),
                    text.getSpanFlags(span));
                text.removeSpan(span);
              }
              layout = measureSpannedText(text, width, widthMode);
            }
          }

          if (mShouldNotifyOnTextLayout) {
            ThemedReactContext themedReactContext = getThemedContext();
            WritableArray lines =
                FontMetricsUtil.getFontMetrics(
                    text, layout, sTextPaintInstance, themedReactContext);
            WritableMap event = Arguments.createMap();
            event.putArray("lines", lines);
            if (themedReactContext.hasActiveReactInstance()) {
              themedReactContext
                  .getJSModule(RCTEventEmitter.class)
                  .receiveEvent(getReactTag(), "topTextLayout", event);
            } else {
              ReactSoftExceptionLogger.logSoftException(
                  "ReactTextShadowNode",
                  new ReactNoCrashSoftException("Cannot get RCTEventEmitter, no CatalystInstance"));
            }
          }

          final int lineCount =
              mNumberOfLines == ReactConstants.UNSET
                  ? layout.getLineCount()
                  : Math.min(mNumberOfLines, layout.getLineCount());

          // Instead of using `layout.getWidth()` (which may yield a significantly larger width for
          // text that is wrapping), compute width using the longest line.
          float layoutWidth = 0;
          if (widthMode == YogaMeasureMode.EXACTLY) {
            layoutWidth = width;
          } else {
            for (int lineIndex = 0; lineIndex < lineCount; lineIndex++) {
              boolean endsWithNewLine =
                  text.length() > 0 && text.charAt(layout.getLineEnd(lineIndex) - 1) == '\n';
              float lineWidth =
                  endsWithNewLine ? layout.getLineMax(lineIndex) : layout.getLineWidth(lineIndex);
              if (lineWidth > layoutWidth) {
                layoutWidth = lineWidth;
              }
            }
            if (widthMode == YogaMeasureMode.AT_MOST && layoutWidth > width) {
              layoutWidth = width;
            }
          }

          if (Build.VERSION.SDK_INT > Build.VERSION_CODES.Q) {
            layoutWidth = (float) Math.ceil(layoutWidth);
          }
          float layoutHeight = height;
          if (heightMode != YogaMeasureMode.EXACTLY) {
            layoutHeight = layout.getLineBottom(lineCount - 1);
            if (heightMode == YogaMeasureMode.AT_MOST && layoutHeight > height) {
              layoutHeight = height;
            }
          }

          return YogaMeasureOutput.make(layoutWidth, layoutHeight);
        }
      };

  private final YogaBaselineFunction mTextBaselineFunction =
      new YogaBaselineFunction() {
        @Override
        public float baseline(YogaNode node, float width, float height) {
          Spannable text =
              Assertions.assertNotNull(
                  mPreparedSpannableText,
                  "Spannable element has not been prepared in onBeforeLayout");

          Layout layout = measureSpannedText(text, width, YogaMeasureMode.EXACTLY);
          return layout.getLineBaseline(layout.getLineCount() - 1);
        }
      };

  public ReactTextShadowNode() {
    this(null);
  }

  public ReactTextShadowNode(@Nullable ReactTextViewManagerCallback reactTextViewManagerCallback) {
    super(reactTextViewManagerCallback);
    initMeasureFunction();
  }

  private void initMeasureFunction() {
    if (!isVirtual()) {
      setMeasureFunction(mTextMeasureFunction);
      setBaselineFunction(mTextBaselineFunction);
    }
  }

  private Layout measureSpannedText(Spannable text, float width, YogaMeasureMode widthMode) {
    // TODO(5578671): Handle text direction (see View#getTextDirectionHeuristic)
    TextPaint textPaint = sTextPaintInstance;
    textPaint.setTextSize(mTextAttributes.getEffectiveFontSize());
    Layout layout;
    BoringLayout.Metrics boring = BoringLayout.isBoring(text, textPaint);
    float desiredWidth = boring == null ? Layout.getDesiredWidth(text, textPaint) : Float.NaN;

    // technically, width should never be negative, but there is currently a bug in
    boolean unconstrainedWidth = widthMode == YogaMeasureMode.UNDEFINED || width < 0;

    Layout.Alignment alignment = Layout.Alignment.ALIGN_NORMAL;
    switch (getTextAlign()) {
      case Gravity.LEFT:
        alignment = Layout.Alignment.ALIGN_NORMAL;
        break;
      case Gravity.RIGHT:
        alignment = Layout.Alignment.ALIGN_OPPOSITE;
        break;
      case Gravity.CENTER_HORIZONTAL:
        alignment = Layout.Alignment.ALIGN_CENTER;
        break;
    }

    if (boring == null
        && (unconstrainedWidth
            || (!YogaConstants.isUndefined(desiredWidth) && desiredWidth <= width))) {
      // Is used when the width is not known and the text is not boring, ie. if it contains
      // unicode characters.
      int hintWidth = (int) Math.ceil(desiredWidth);
      StaticLayout.Builder builder =
          StaticLayout.Builder.obtain(text, 0, text.length(), textPaint, hintWidth)
              .setAlignment(alignment)
              .setLineSpacing(0.f, 1.f)
              .setIncludePad(mIncludeFontPadding)
              .setBreakStrategy(mTextBreakStrategy)
              .setHyphenationFrequency(mHyphenationFrequency);

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        builder.setJustificationMode(mJustificationMode);
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        builder.setUseLineSpacingFromFallbacks(true);
      }
      layout = builder.build();

    } else if (boring != null && (unconstrainedWidth || boring.width <= width)) {
      // Is used for single-line, boring text when the width is either unknown or bigger
      // than the width of the text.
      layout =
          BoringLayout.make(
              text,
              textPaint,
              Math.max(boring.width, 0),
              alignment,
              1.f,
              0.f,
              boring,
              mIncludeFontPadding);
    } else {
      // Is used for multiline, boring text and the width is known.
      // Android 11+ introduces changes in text width calculation which leads to cases
      // where the container is measured smaller than text. Math.ceil prevents it
      // See T136756103 for investigation
      if (Build.VERSION.SDK_INT > Build.VERSION_CODES.Q) {
        width = (float) Math.ceil(width);
      }

      StaticLayout.Builder builder =
          StaticLayout.Builder.obtain(text, 0, text.length(), textPaint, (int) width)
              .setAlignment(alignment)
              .setLineSpacing(0.f, 1.f)
              .setIncludePad(mIncludeFontPadding)
              .setBreakStrategy(mTextBreakStrategy)
              .setHyphenationFrequency(mHyphenationFrequency);

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        builder.setJustificationMode(mJustificationMode);
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        builder.setUseLineSpacingFromFallbacks(true);
      }
      layout = builder.build();
    }
    return layout;
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
  public void onBeforeLayout(NativeViewHierarchyOptimizer nativeViewHierarchyOptimizer) {
    mPreparedSpannableText =
        spannedFromShadowNode(
            this,
            /* text (e.g. from `value` prop): */ null,
            /* supportsInlineViews: */ true,
            nativeViewHierarchyOptimizer);
    markUpdated();
  }

  @Override
  public boolean isVirtualAnchor() {
    // Text's descendants aren't necessarily all virtual nodes. Text can contain a combination of
    // virtual and non-virtual (e.g. inline views) nodes. Therefore it's not a virtual anchor
    // by the doc comment on {@link ReactShadowNode#isVirtualAnchor}.
    return false;
  }

  @Override
  public boolean hoistNativeChildren() {
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
              ReactConstants.UNSET,
              mContainsImages,
              getPadding(Spacing.START),
              getPadding(Spacing.TOP),
              getPadding(Spacing.END),
              getPadding(Spacing.BOTTOM),
              getTextAlign(),
              mTextBreakStrategy,
              mJustificationMode);
      uiViewOperationQueue.enqueueUpdateExtraData(getReactTag(), reactTextUpdate);
    }
  }

  @ReactProp(name = "onTextLayout")
  public void setShouldNotifyOnTextLayout(boolean shouldNotifyOnTextLayout) {
    mShouldNotifyOnTextLayout = shouldNotifyOnTextLayout;
  }

  @Override
  @Nullable
  public Iterable<? extends ReactShadowNode> calculateLayoutOnChildren() {
    // Run flexbox on and return the descendants which are inline views.

    if (mInlineViews == null || mInlineViews.isEmpty()) {
      return null;
    }

    Spanned text =
        Assertions.assertNotNull(
            mPreparedSpannableText, "Spannable element has not been prepared in onBeforeLayout");
    TextInlineViewPlaceholderSpan[] placeholders =
        text.getSpans(0, text.length(), TextInlineViewPlaceholderSpan.class);
    ArrayList<ReactShadowNode> shadowNodes = new ArrayList<>(placeholders.length);

    for (TextInlineViewPlaceholderSpan placeholder : placeholders) {
      ReactShadowNode child = mInlineViews.get(placeholder.getReactTag());
      child.calculateLayout();
      shadowNodes.add(child);
    }

    return shadowNodes;
  }
}

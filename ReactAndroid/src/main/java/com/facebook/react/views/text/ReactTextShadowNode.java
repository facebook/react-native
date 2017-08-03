/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

import javax.annotation.Nullable;

import java.util.ArrayList;
import java.util.List;

import android.graphics.Typeface;
import android.os.Build;
import android.text.BoringLayout;
import android.text.Layout;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.text.style.AbsoluteSizeSpan;
import android.text.style.BackgroundColorSpan;
import android.text.style.ForegroundColorSpan;
import android.text.style.StrikethroughSpan;
import android.text.style.UnderlineSpan;
import android.view.Gravity;
import android.widget.TextView;

import com.facebook.yoga.YogaDirection;
import com.facebook.yoga.YogaConstants;
import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaNode;
import com.facebook.yoga.YogaMeasureOutput;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * {@link ReactShadowNode} class for spannable text view.
 * <p/>
 * This node calculates {@link Spannable} based on subnodes of the same type and passes the
 * resulting object down to textview's shadowview and actual native {@link TextView} instance. It is
 * important to keep in mind that {@link Spannable} is calculated only on layout step, so if there
 * are any text properties that may/should affect the result of {@link Spannable} they should be set
 * in a corresponding {@link ReactTextShadowNode}. Resulting {@link Spannable} object is then then
 * passed as "computedDataFromMeasure" down to shadow and native view.
 * <p/>
 * TODO(7255858): Rename *CSSNodeDEPRECATED to *ShadowView (or sth similar) as it's no longer is used solely
 * for layouting
 */
public class ReactTextShadowNode extends LayoutShadowNode {

  private static final String INLINE_IMAGE_PLACEHOLDER = "I";
  public static final int UNSET = -1;

  @VisibleForTesting
  public static final String PROP_TEXT = "text";

  public static final String PROP_SHADOW_OFFSET = "textShadowOffset";
  public static final String PROP_SHADOW_OFFSET_WIDTH = "width";
  public static final String PROP_SHADOW_OFFSET_HEIGHT = "height";
  public static final String PROP_SHADOW_RADIUS = "textShadowRadius";
  public static final String PROP_SHADOW_COLOR = "textShadowColor";

  public static final int DEFAULT_TEXT_SHADOW_COLOR = 0x55000000;

  // It's important to pass the ANTI_ALIAS_FLAG flag to the constructor rather than setting it
  // later by calling setFlags. This is because the latter approach triggers a bug on Android 4.4.2.
  // The bug is that unicode emoticons aren't measured properly which causes text to be clipped.
  private static final TextPaint sTextPaintInstance = new TextPaint(TextPaint.ANTI_ALIAS_FLAG);

  private static class SetSpanOperation {
    protected int start, end;
    protected Object what;
    SetSpanOperation(int start, int end, Object what) {
      this.start = start;
      this.end = end;
      this.what = what;
    }
    public void execute(SpannableStringBuilder sb) {
      // All spans will automatically extend to the right of the text, but not the left - except
      // for spans that start at the beginning of the text.
      int spanFlags = Spannable.SPAN_EXCLUSIVE_INCLUSIVE;
      if (start == 0) {
        spanFlags = Spannable.SPAN_INCLUSIVE_INCLUSIVE;
      }
      sb.setSpan(what, start, end, spanFlags);
    }
  }

  private static void buildSpannedFromTextCSSNode(
      ReactTextShadowNode textShadowNode,
      SpannableStringBuilder sb,
      List<SetSpanOperation> ops) {
    int start = sb.length();
    if (textShadowNode.mText != null) {
      sb.append(textShadowNode.mText);
    }
    for (int i = 0, length = textShadowNode.getChildCount(); i < length; i++) {
      ReactShadowNode child = textShadowNode.getChildAt(i);
      if (child instanceof ReactTextShadowNode) {
        buildSpannedFromTextCSSNode((ReactTextShadowNode) child, sb, ops);
      } else if (child instanceof ReactTextInlineImageShadowNode) {
        // We make the image take up 1 character in the span and put a corresponding character into
        // the text so that the image doesn't run over any following text.
        sb.append(INLINE_IMAGE_PLACEHOLDER);
        ops.add(
          new SetSpanOperation(
            sb.length() - INLINE_IMAGE_PLACEHOLDER.length(),
            sb.length(),
            ((ReactTextInlineImageShadowNode) child).buildInlineImageSpan()));
      } else {
        throw new IllegalViewOperationException("Unexpected view type nested under text node: "
                + child.getClass());
      }
      child.markUpdateSeen();
    }
    int end = sb.length();
    if (end >= start) {
      if (textShadowNode.mIsColorSet) {
        ops.add(new SetSpanOperation(start, end, new ForegroundColorSpan(textShadowNode.mColor)));
      }
      if (textShadowNode.mIsBackgroundColorSet) {
        ops.add(new SetSpanOperation(
                start,
                end,
                new BackgroundColorSpan(textShadowNode.mBackgroundColor)));
      }
      if (textShadowNode.mFontSize != UNSET) {
        ops.add(new SetSpanOperation(start, end, new AbsoluteSizeSpan(textShadowNode.mFontSize)));
      }
      if (textShadowNode.mFontStyle != UNSET ||
          textShadowNode.mFontWeight != UNSET ||
          textShadowNode.mFontFamily != null) {
        ops.add(new SetSpanOperation(
                start,
                end,
                new CustomStyleSpan(
                    textShadowNode.mFontStyle,
                    textShadowNode.mFontWeight,
                    textShadowNode.mFontFamily,
                    textShadowNode.getThemedContext().getAssets())));
      }
      if (textShadowNode.mIsUnderlineTextDecorationSet) {
        ops.add(new SetSpanOperation(start, end, new UnderlineSpan()));
      }
      if (textShadowNode.mIsLineThroughTextDecorationSet) {
        ops.add(new SetSpanOperation(start, end, new StrikethroughSpan()));
      }
      if (textShadowNode.mTextShadowOffsetDx != 0 || textShadowNode.mTextShadowOffsetDy != 0) {
        ops.add(new SetSpanOperation(
                start,
                end,
                new ShadowStyleSpan(
                    textShadowNode.mTextShadowOffsetDx,
                    textShadowNode.mTextShadowOffsetDy,
                    textShadowNode.mTextShadowRadius,
                    textShadowNode.mTextShadowColor)));
      }
      if (!Float.isNaN(textShadowNode.getEffectiveLineHeight())) {
        ops.add(new SetSpanOperation(
                start,
                end,
                new CustomLineHeightSpan(textShadowNode.getEffectiveLineHeight())));
      }
      ops.add(new SetSpanOperation(start, end, new ReactTagSpan(textShadowNode.getReactTag())));
    }
  }

  protected static Spannable fromTextCSSNode(ReactTextShadowNode textCSSNode) {
    SpannableStringBuilder sb = new SpannableStringBuilder();
    // TODO(5837930): Investigate whether it's worth optimizing this part and do it if so

    // The {@link SpannableStringBuilder} implementation require setSpan operation to be called
    // up-to-bottom, otherwise all the spannables that are withing the region for which one may set
    // a new spannable will be wiped out
    List<SetSpanOperation> ops = new ArrayList<>();
    buildSpannedFromTextCSSNode(textCSSNode, sb, ops);
    if (textCSSNode.mFontSize == UNSET) {
      sb.setSpan(
          new AbsoluteSizeSpan(textCSSNode.mAllowFontScaling
          ? (int) Math.ceil(PixelUtil.toPixelFromSP(ViewDefaults.FONT_SIZE_SP))
          : (int) Math.ceil(PixelUtil.toPixelFromDIP(ViewDefaults.FONT_SIZE_SP))),
          0,
          sb.length(),
          Spannable.SPAN_INCLUSIVE_EXCLUSIVE);
    }

    textCSSNode.mContainsImages = false;
    textCSSNode.mHeightOfTallestInlineImage = Float.NaN;

    // While setting the Spans on the final text, we also check whether any of them are images
    for (int i = ops.size() - 1; i >= 0; i--) {
      SetSpanOperation op = ops.get(i);
      if (op.what instanceof TextInlineImageSpan) {
        int height = ((TextInlineImageSpan)op.what).getHeight();
        textCSSNode.mContainsImages = true;
        if (Float.isNaN(textCSSNode.mHeightOfTallestInlineImage) || height > textCSSNode.mHeightOfTallestInlineImage) {
          textCSSNode.mHeightOfTallestInlineImage = height;
        }
      }
      op.execute(sb);
    }
    return sb;
  }

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
                true);
            } else {
              layout = StaticLayout.Builder.obtain(text, 0, text.length(), textPaint, hintWidth)
                .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .setLineSpacing(0.f, 1.f)
                .setIncludePad(true)
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
                true);
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
                  true);
            } else {
              layout = StaticLayout.Builder.obtain(text, 0, text.length(), textPaint, (int) width)
                .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .setLineSpacing(0.f, 1.f)
                .setIncludePad(true)
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

  /**
   * Return -1 if the input string is not a valid numeric fontWeight (100, 200, ..., 900), otherwise
   * return the weight.
   *
   * This code is duplicated in ReactTextInputManager
   * TODO: Factor into a common place they can both use
   */
  private static int parseNumericFontWeight(String fontWeightString) {
    // This should be much faster than using regex to verify input and Integer.parseInt
    return fontWeightString.length() == 3 && fontWeightString.endsWith("00")
        && fontWeightString.charAt(0) <= '9' && fontWeightString.charAt(0) >= '1' ?
        100 * (fontWeightString.charAt(0) - '0') : -1;
  }

  private float mLineHeight = Float.NaN;
  private boolean mIsColorSet = false;
  private boolean mAllowFontScaling = true;
  private int mColor;
  private boolean mIsBackgroundColorSet = false;
  private int mBackgroundColor;

  protected int mNumberOfLines = UNSET;
  protected int mFontSize = UNSET;
  protected float mFontSizeInput = UNSET;
  protected float mLineHeightInput = UNSET;
  protected int mTextAlign = Gravity.NO_GRAVITY;
  protected int mTextBreakStrategy = (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) ?
      0 : Layout.BREAK_STRATEGY_HIGH_QUALITY;

  private float mTextShadowOffsetDx = 0;
  private float mTextShadowOffsetDy = 0;
  private float mTextShadowRadius = 1;
  private int mTextShadowColor = DEFAULT_TEXT_SHADOW_COLOR;

  private boolean mIsUnderlineTextDecorationSet = false;
  private boolean mIsLineThroughTextDecorationSet = false;

  /**
   * mFontStyle can be {@link Typeface#NORMAL} or {@link Typeface#ITALIC}.
   * mFontWeight can be {@link Typeface#NORMAL} or {@link Typeface#BOLD}.
   */
  private int mFontStyle = UNSET;
  private int mFontWeight = UNSET;
  /**
   * NB: If a font family is used that does not have a style in a certain Android version (ie.
   * monospace bold pre Android 5.0), that style (ie. bold) will not be inherited by nested Text
   * nodes. To retain that style, you have to add it to those nodes explicitly.
   * Example, Android 4.4:
   * <Text style={{fontFamily="serif" fontWeight="bold"}}>Bold Text</Text>
   *   <Text style={{fontFamily="sans-serif"}}>Bold Text</Text>
   *     <Text style={{fontFamily="serif}}>Bold Text</Text>
   *
   * <Text style={{fontFamily="monospace" fontWeight="bold"}}>Not Bold Text</Text>
   *   <Text style={{fontFamily="sans-serif"}}>Not Bold Text</Text>
   *     <Text style={{fontFamily="serif}}>Not Bold Text</Text>
   *
   * <Text style={{fontFamily="monospace" fontWeight="bold"}}>Not Bold Text</Text>
   *   <Text style={{fontFamily="sans-serif" fontWeight="bold"}}>Bold Text</Text>
   *     <Text style={{fontFamily="serif}}>Bold Text</Text>
   */
  private @Nullable String mFontFamily = null;
  private @Nullable String mText = null;

  private @Nullable Spannable mPreparedSpannableText;

  protected boolean mContainsImages = false;
  private float mHeightOfTallestInlineImage = Float.NaN;

  public ReactTextShadowNode() {
    if (!isVirtual()) {
      setMeasureFunction(mTextMeasureFunction);
    }
  }

  // Returns a line height which takes into account the requested line height
  // and the height of the inline images.
  public float getEffectiveLineHeight() {
    boolean useInlineViewHeight = !Float.isNaN(mLineHeight) &&
        !Float.isNaN(mHeightOfTallestInlineImage) &&
        mHeightOfTallestInlineImage > mLineHeight;
    return useInlineViewHeight ? mHeightOfTallestInlineImage : mLineHeight;
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
    if (isVirtual()) {
      return;
    }
    mPreparedSpannableText = fromTextCSSNode(this);
    markUpdated();
  }

  @Override
  public void markUpdated() {
    super.markUpdated();
    // We mark virtual anchor node as dirty as updated text needs to be re-measured
    if (!isVirtual()) {
      super.dirty();
    }
  }

  @ReactProp(name = PROP_TEXT)
  public void setText(@Nullable String text) {
    mText = text;
    markUpdated();
  }

  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = UNSET)
  public void setNumberOfLines(int numberOfLines) {
    mNumberOfLines = numberOfLines == 0 ? UNSET : numberOfLines;
    markUpdated();
  }

  @ReactProp(name = ViewProps.LINE_HEIGHT, defaultFloat = UNSET)
  public void setLineHeight(float lineHeight) {
    mLineHeightInput = lineHeight;
    if (lineHeight == UNSET) {
      mLineHeight = Float.NaN;
    } else {
      mLineHeight = mAllowFontScaling ?
        PixelUtil.toPixelFromSP(lineHeight) : PixelUtil.toPixelFromDIP(lineHeight);
    }
    markUpdated();
  }

  @ReactProp(name = ViewProps.ALLOW_FONT_SCALING, defaultBoolean = true)
  public void setAllowFontScaling(boolean allowFontScaling) {
    if (allowFontScaling != mAllowFontScaling) {
      mAllowFontScaling = allowFontScaling;
      setFontSize(mFontSizeInput);
      setLineHeight(mLineHeightInput);
      markUpdated();
    }
  }

  @ReactProp(name = ViewProps.TEXT_ALIGN)
  public void setTextAlign(@Nullable String textAlign) {
    if (textAlign == null || "auto".equals(textAlign)) {
      mTextAlign = Gravity.NO_GRAVITY;
    } else if ("left".equals(textAlign)) {
      mTextAlign = Gravity.LEFT;
    } else if ("right".equals(textAlign)) {
      mTextAlign = Gravity.RIGHT;
    } else if ("center".equals(textAlign)) {
      mTextAlign = Gravity.CENTER_HORIZONTAL;
    } else if ("justify".equals(textAlign)) {
      // Fallback gracefully for cross-platform compat instead of error
      mTextAlign = Gravity.LEFT;
    } else {
      throw new JSApplicationIllegalArgumentException("Invalid textAlign: " + textAlign);
    }
    markUpdated();
  }

  @ReactProp(name = ViewProps.FONT_SIZE, defaultFloat = UNSET)
  public void setFontSize(float fontSize) {
    mFontSizeInput = fontSize;
    if (fontSize != UNSET) {
      fontSize = mAllowFontScaling ? (float) Math.ceil(PixelUtil.toPixelFromSP(fontSize))
        : (float) Math.ceil(PixelUtil.toPixelFromDIP(fontSize));
    }
    mFontSize = (int) fontSize;
    markUpdated();
  }

  @ReactProp(name = ViewProps.COLOR)
  public void setColor(@Nullable Integer color) {
    mIsColorSet = (color != null);
    if (mIsColorSet) {
      mColor = color;
    }
    markUpdated();
  }

  @ReactProp(name = ViewProps.BACKGROUND_COLOR)
  public void setBackgroundColor(Integer color) {
    // Don't apply background color to anchor TextView since it will be applied on the View directly
    if (!isVirtualAnchor()) {
      mIsBackgroundColorSet = (color != null);
      if (mIsBackgroundColorSet) {
        mBackgroundColor = color;
      }
      markUpdated();
    }
  }

  @ReactProp(name = ViewProps.FONT_FAMILY)
  public void setFontFamily(@Nullable String fontFamily) {
    mFontFamily = fontFamily;
    markUpdated();
  }

  /**
  /* This code is duplicated in ReactTextInputManager
  /* TODO: Factor into a common place they can both use
  */
  @ReactProp(name = ViewProps.FONT_WEIGHT)
  public void setFontWeight(@Nullable String fontWeightString) {
    int fontWeightNumeric = fontWeightString != null ?
        parseNumericFontWeight(fontWeightString) : -1;
    int fontWeight = UNSET;
    if (fontWeightNumeric >= 500 || "bold".equals(fontWeightString)) {
      fontWeight = Typeface.BOLD;
    } else if ("normal".equals(fontWeightString) ||
        (fontWeightNumeric != -1 && fontWeightNumeric < 500)) {
      fontWeight = Typeface.NORMAL;
    }
    if (fontWeight != mFontWeight) {
      mFontWeight = fontWeight;
      markUpdated();
    }
  }

  /**
  /* This code is duplicated in ReactTextInputManager
  /* TODO: Factor into a common place they can both use
  */
  @ReactProp(name = ViewProps.FONT_STYLE)
  public void setFontStyle(@Nullable String fontStyleString) {
    int fontStyle = UNSET;
    if ("italic".equals(fontStyleString)) {
      fontStyle = Typeface.ITALIC;
    } else if ("normal".equals(fontStyleString)) {
      fontStyle = Typeface.NORMAL;
    }
    if (fontStyle != mFontStyle) {
      mFontStyle = fontStyle;
      markUpdated();
    }
  }

  @ReactProp(name = ViewProps.TEXT_DECORATION_LINE)
  public void setTextDecorationLine(@Nullable String textDecorationLineString) {
    mIsUnderlineTextDecorationSet = false;
    mIsLineThroughTextDecorationSet = false;
    if (textDecorationLineString != null) {
      for (String textDecorationLineSubString : textDecorationLineString.split(" ")) {
        if ("underline".equals(textDecorationLineSubString)) {
          mIsUnderlineTextDecorationSet = true;
        } else if ("line-through".equals(textDecorationLineSubString)) {
          mIsLineThroughTextDecorationSet = true;
        }
      }
    }
    markUpdated();
  }

  @ReactProp(name = ViewProps.TEXT_BREAK_STRATEGY)
  public void setTextBreakStrategy(@Nullable String textBreakStrategy) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return;
    }

    if (textBreakStrategy == null || "highQuality".equals(textBreakStrategy)) {
      mTextBreakStrategy = Layout.BREAK_STRATEGY_HIGH_QUALITY;
    } else if ("simple".equals(textBreakStrategy)) {
      mTextBreakStrategy = Layout.BREAK_STRATEGY_SIMPLE;
    } else if ("balanced".equals(textBreakStrategy)) {
      mTextBreakStrategy = Layout.BREAK_STRATEGY_BALANCED;
    } else {
      throw new JSApplicationIllegalArgumentException("Invalid textBreakStrategy: " + textBreakStrategy);
    }

    markUpdated();
  }

  @ReactProp(name = PROP_SHADOW_OFFSET)
  public void setTextShadowOffset(ReadableMap offsetMap) {
    mTextShadowOffsetDx = 0;
    mTextShadowOffsetDy = 0;

    if (offsetMap != null) {
      if (offsetMap.hasKey(PROP_SHADOW_OFFSET_WIDTH) &&
          !offsetMap.isNull(PROP_SHADOW_OFFSET_WIDTH)) {
        mTextShadowOffsetDx =
            PixelUtil.toPixelFromDIP(offsetMap.getDouble(PROP_SHADOW_OFFSET_WIDTH));
      }
      if (offsetMap.hasKey(PROP_SHADOW_OFFSET_HEIGHT) &&
          !offsetMap.isNull(PROP_SHADOW_OFFSET_HEIGHT)) {
        mTextShadowOffsetDy =
            PixelUtil.toPixelFromDIP(offsetMap.getDouble(PROP_SHADOW_OFFSET_HEIGHT));
      }
    }

    markUpdated();
  }

  @ReactProp(name = PROP_SHADOW_RADIUS, defaultInt = 1)
  public void setTextShadowRadius(float textShadowRadius) {
    if (textShadowRadius != mTextShadowRadius) {
      mTextShadowRadius = textShadowRadius;
      markUpdated();
    }
  }

  @ReactProp(name = PROP_SHADOW_COLOR, defaultInt = DEFAULT_TEXT_SHADOW_COLOR, customType = "Color")
  public void setTextShadowColor(int textShadowColor) {
    if (textShadowColor != mTextShadowColor) {
      mTextShadowColor = textShadowColor;
      markUpdated();
    }
  }

  @Override
  public boolean isVirtualAnchor() {
    return !isVirtual();
  }

  @Override
  public void onCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue) {
    if (isVirtual()) {
      return;
    }
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

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.views.text;

import android.graphics.Typeface;
import android.os.Build;
import android.text.Layout;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.style.AbsoluteSizeSpan;
import android.text.style.BackgroundColorSpan;
import android.text.style.ForegroundColorSpan;
import android.text.style.StrikethroughSpan;
import android.text.style.UnderlineSpan;
import android.view.Gravity;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.yoga.YogaDirection;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Nullable;

/**
 * {@link ReactShadowNode} abstract class for spannable text nodes.
 *
 * <p>This class handles all text attributes assosiated with {@code <Text>}-ish node. A concrete
 * node can be an anchor {@code <Text>} node, an anchor {@code <TextInput>} node or virtual {@code
 * <Text>} node inside {@code <Text>} or {@code <TextInput>} node. Or even something else.
 *
 * <p>This also node calculates {@link Spannable} object based on subnodes of the same type, which
 * can be used in concrete classes to feed native views and compute layout.
 */
public abstract class ReactBaseTextShadowNode extends LayoutShadowNode {

  private static final String INLINE_IMAGE_PLACEHOLDER = "I";
  public static final int UNSET = -1;

  public static final String PROP_SHADOW_OFFSET = "textShadowOffset";
  public static final String PROP_SHADOW_OFFSET_WIDTH = "width";
  public static final String PROP_SHADOW_OFFSET_HEIGHT = "height";
  public static final String PROP_SHADOW_RADIUS = "textShadowRadius";
  public static final String PROP_SHADOW_COLOR = "textShadowColor";

  public static final int DEFAULT_TEXT_SHADOW_COLOR = 0x55000000;

  private static class SetSpanOperation {
    protected int start, end;
    protected Object what;

    SetSpanOperation(int start, int end, Object what) {
      this.start = start;
      this.end = end;
      this.what = what;
    }

    public void execute(SpannableStringBuilder sb, int priority) {
      // All spans will automatically extend to the right of the text, but not the left - except
      // for spans that start at the beginning of the text.
      int spanFlags = Spannable.SPAN_EXCLUSIVE_INCLUSIVE;
      if (start == 0) {
        spanFlags = Spannable.SPAN_INCLUSIVE_INCLUSIVE;
      }

      spanFlags &= ~Spannable.SPAN_PRIORITY;
      spanFlags |= (priority << Spannable.SPAN_PRIORITY_SHIFT) & Spannable.SPAN_PRIORITY;

      sb.setSpan(what, start, end, spanFlags);
    }
  }

  private static void buildSpannedFromShadowNode(
      ReactBaseTextShadowNode textShadowNode,
      SpannableStringBuilder sb,
      List<SetSpanOperation> ops) {

    int start = sb.length();

    for (int i = 0, length = textShadowNode.getChildCount(); i < length; i++) {
      ReactShadowNode child = textShadowNode.getChildAt(i);

      if (child instanceof ReactRawTextShadowNode) {
        sb.append(((ReactRawTextShadowNode) child).getText());
      } else if (child instanceof ReactBaseTextShadowNode) {
        buildSpannedFromShadowNode((ReactBaseTextShadowNode) child, sb, ops);
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
        throw new IllegalViewOperationException(
            "Unexpected view type nested under text node: " + child.getClass());
      }
      child.markUpdateSeen();
    }
    int end = sb.length();
    if (end >= start) {
      if (textShadowNode.mIsColorSet) {
        ops.add(new SetSpanOperation(start, end, new ForegroundColorSpan(textShadowNode.mColor)));
      }
      if (textShadowNode.mIsBackgroundColorSet) {
        ops.add(
            new SetSpanOperation(
                start, end, new BackgroundColorSpan(textShadowNode.mBackgroundColor)));
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        if (!Float.isNaN(textShadowNode.mLetterSpacing)) {
          ops.add(new SetSpanOperation(
            start,
            end,
            new CustomLetterSpacingSpan(textShadowNode.mLetterSpacing)));
        }
      }
      if (textShadowNode.mFontSize != UNSET) {
        ops.add(new SetSpanOperation(start, end, new AbsoluteSizeSpan(textShadowNode.mFontSize)));
      }
      if (textShadowNode.mFontStyle != UNSET
          || textShadowNode.mFontWeight != UNSET
          || textShadowNode.mFontFamily != null) {
        ops.add(
            new SetSpanOperation(
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
        ops.add(
            new SetSpanOperation(
                start,
                end,
                new ShadowStyleSpan(
                    textShadowNode.mTextShadowOffsetDx,
                    textShadowNode.mTextShadowOffsetDy,
                    textShadowNode.mTextShadowRadius,
                    textShadowNode.mTextShadowColor)));
      }
      if (!Float.isNaN(textShadowNode.getEffectiveLineHeight())) {
        ops.add(
            new SetSpanOperation(
                start, end, new CustomLineHeightSpan(textShadowNode.getEffectiveLineHeight())));
      }
      ops.add(new SetSpanOperation(start, end, new ReactTagSpan(textShadowNode.getReactTag())));
    }
  }

  protected static Spannable spannedFromShadowNode(
      ReactBaseTextShadowNode textShadowNode, String text) {
    SpannableStringBuilder sb = new SpannableStringBuilder();

    // TODO(5837930): Investigate whether it's worth optimizing this part and do it if so

    // The {@link SpannableStringBuilder} implementation require setSpan operation to be called
    // up-to-bottom, otherwise all the spannables that are withing the region for which one may set
    // a new spannable will be wiped out
    List<SetSpanOperation> ops = new ArrayList<>();

    buildSpannedFromShadowNode(textShadowNode, sb, ops);

    if (text != null) {
      sb.append(text);
    }

    if (textShadowNode.mFontSize == UNSET) {
      int defaultFontSize =
          textShadowNode.mAllowFontScaling
              ? (int) Math.ceil(PixelUtil.toPixelFromSP(ViewDefaults.FONT_SIZE_SP))
              : (int) Math.ceil(PixelUtil.toPixelFromDIP(ViewDefaults.FONT_SIZE_SP));

      ops.add(new SetSpanOperation(0, sb.length(), new AbsoluteSizeSpan(defaultFontSize)));
    }

    textShadowNode.mContainsImages = false;
    textShadowNode.mHeightOfTallestInlineImage = Float.NaN;

    // While setting the Spans on the final text, we also check whether any of them are images.
    int priority = 0;
    for (SetSpanOperation op : ops) {
      if (op.what instanceof TextInlineImageSpan) {
        int height = ((TextInlineImageSpan) op.what).getHeight();
        textShadowNode.mContainsImages = true;
        if (Float.isNaN(textShadowNode.mHeightOfTallestInlineImage)
            || height > textShadowNode.mHeightOfTallestInlineImage) {
          textShadowNode.mHeightOfTallestInlineImage = height;
        }
      }

      // Actual order of calling {@code execute} does NOT matter,
      // but the {@code priority} DOES matter.
      op.execute(sb, priority);
      priority++;
    }

    return sb;
  }

  /**
   * Return -1 if the input string is not a valid numeric fontWeight (100, 200, ..., 900), otherwise
   * return the weight.
   *
   * This code is duplicated in ReactTextInputManager
   * TODO: Factor into a common place they can both use
   */
  private static int parseNumericFontWeight(String fontWeightString) {
    // This should be much faster than using regex to verify input and Integer.parseInt
    return fontWeightString.length() == 3
            && fontWeightString.endsWith("00")
            && fontWeightString.charAt(0) <= '9'
            && fontWeightString.charAt(0) >= '1'
        ? 100 * (fontWeightString.charAt(0) - '0')
        : -1;
  }

  protected float mLineHeight = Float.NaN;
  protected float mLetterSpacing = Float.NaN;
  protected boolean mIsColorSet = false;
  protected boolean mAllowFontScaling = true;
  protected int mColor;
  protected boolean mIsBackgroundColorSet = false;
  protected int mBackgroundColor;

  protected int mNumberOfLines = UNSET;
  protected int mFontSize = UNSET;
  protected float mFontSizeInput = UNSET;
  protected float mLineHeightInput = UNSET;
  protected float mLetterSpacingInput = Float.NaN;
  protected int mTextAlign = Gravity.NO_GRAVITY;
  protected int mTextBreakStrategy =
      (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) ? 0 : Layout.BREAK_STRATEGY_HIGH_QUALITY;

  protected float mTextShadowOffsetDx = 0;
  protected float mTextShadowOffsetDy = 0;
  protected float mTextShadowRadius = 1;
  protected int mTextShadowColor = DEFAULT_TEXT_SHADOW_COLOR;

  protected boolean mIsUnderlineTextDecorationSet = false;
  protected boolean mIsLineThroughTextDecorationSet = false;
  protected boolean mIncludeFontPadding = true;

  /**
   * mFontStyle can be {@link Typeface#NORMAL} or {@link Typeface#ITALIC}.
   * mFontWeight can be {@link Typeface#NORMAL} or {@link Typeface#BOLD}.
   */
  protected int mFontStyle = UNSET;

  protected int mFontWeight = UNSET;
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
  protected @Nullable String mFontFamily = null;

  protected boolean mContainsImages = false;
  protected float mHeightOfTallestInlineImage = Float.NaN;

  public ReactBaseTextShadowNode() {}

  public ReactBaseTextShadowNode(ReactBaseTextShadowNode node) {
    super(node);
    mLineHeight = node.mLineHeight;
    mIsColorSet = node.mIsColorSet;
    mAllowFontScaling = node.mAllowFontScaling;
    mColor = node.mColor;
    mIsBackgroundColorSet = node.mIsBackgroundColorSet;
    mBackgroundColor = node.mBackgroundColor;

    mNumberOfLines = node.mNumberOfLines;
    mFontSize = node.mFontSize;
    mFontSizeInput = node.mFontSizeInput;
    mLineHeightInput = node.mLineHeightInput;
    mTextAlign = node.mTextAlign;
    mTextBreakStrategy = node.mTextBreakStrategy;

    mTextShadowOffsetDx = node.mTextShadowOffsetDx;
    mTextShadowOffsetDy = node.mTextShadowOffsetDy;
    mTextShadowRadius = node.mTextShadowRadius;
    mTextShadowColor = node.mTextShadowColor;

    mIsUnderlineTextDecorationSet = node.mIsUnderlineTextDecorationSet;
    mIsLineThroughTextDecorationSet = node.mIsLineThroughTextDecorationSet;
    mIncludeFontPadding = node.mIncludeFontPadding;
    mFontStyle = node.mFontStyle;
    mFontWeight = node.mFontWeight;
    mFontFamily = node.mFontFamily;
    mContainsImages = node.mContainsImages;
    mHeightOfTallestInlineImage = node.mHeightOfTallestInlineImage;
  }

  // Returns a line height which takes into account the requested line height
  // and the height of the inline images.
  public float getEffectiveLineHeight() {
    boolean useInlineViewHeight =
        !Float.isNaN(mLineHeight)
            && !Float.isNaN(mHeightOfTallestInlineImage)
            && mHeightOfTallestInlineImage > mLineHeight;
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
      mLineHeight =
          mAllowFontScaling
              ? PixelUtil.toPixelFromSP(lineHeight)
              : PixelUtil.toPixelFromDIP(lineHeight);
    }
    markUpdated();
  }

  @ReactProp(name = ViewProps.LETTER_SPACING, defaultFloat = Float.NaN)
  public void setLetterSpacing(float letterSpacing) {
    mLetterSpacingInput = letterSpacing;
    mLetterSpacing = mAllowFontScaling
      ? PixelUtil.toPixelFromSP(mLetterSpacingInput)
      : PixelUtil.toPixelFromDIP(mLetterSpacingInput);
    markUpdated();
  }

  @ReactProp(name = ViewProps.ALLOW_FONT_SCALING, defaultBoolean = true)
  public void setAllowFontScaling(boolean allowFontScaling) {
    if (allowFontScaling != mAllowFontScaling) {
      mAllowFontScaling = allowFontScaling;
      setFontSize(mFontSizeInput);
      setLineHeight(mLineHeightInput);
      setLetterSpacing(mLetterSpacingInput);
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
      fontSize =
          mAllowFontScaling
              ? (float) Math.ceil(PixelUtil.toPixelFromSP(fontSize))
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
    int fontWeightNumeric =
        fontWeightString != null ? parseNumericFontWeight(fontWeightString) : -1;
    int fontWeight = UNSET;
    if (fontWeightNumeric >= 500 || "bold".equals(fontWeightString)) {
      fontWeight = Typeface.BOLD;
    } else if ("normal".equals(fontWeightString)
        || (fontWeightNumeric != -1 && fontWeightNumeric < 500)) {
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

  @ReactProp(name = ViewProps.INCLUDE_FONT_PADDING, defaultBoolean = true)
  public void setIncludeFontPadding(boolean includepad) {
    mIncludeFontPadding = includepad;
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
      throw new JSApplicationIllegalArgumentException(
          "Invalid textBreakStrategy: " + textBreakStrategy);
    }

    markUpdated();
  }

  @ReactProp(name = PROP_SHADOW_OFFSET)
  public void setTextShadowOffset(ReadableMap offsetMap) {
    mTextShadowOffsetDx = 0;
    mTextShadowOffsetDy = 0;

    if (offsetMap != null) {
      if (offsetMap.hasKey(PROP_SHADOW_OFFSET_WIDTH)
          && !offsetMap.isNull(PROP_SHADOW_OFFSET_WIDTH)) {
        mTextShadowOffsetDx =
            PixelUtil.toPixelFromDIP(offsetMap.getDouble(PROP_SHADOW_OFFSET_WIDTH));
      }
      if (offsetMap.hasKey(PROP_SHADOW_OFFSET_HEIGHT)
          && !offsetMap.isNull(PROP_SHADOW_OFFSET_HEIGHT)) {
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
}

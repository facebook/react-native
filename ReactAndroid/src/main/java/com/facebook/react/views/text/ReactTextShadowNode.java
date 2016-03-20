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
import android.widget.TextView;

import com.facebook.csslayout.CSSConstants;
import com.facebook.csslayout.CSSNode;
import com.facebook.csslayout.MeasureOutput;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.LayoutShadowNode;
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
 * TODO(7255858): Rename *CSSNode to *ShadowView (or sth similar) as it's no longer is used solely
 * for layouting
 */
public class ReactTextShadowNode extends LayoutShadowNode {

  private static final String INLINE_IMAGE_PLACEHOLDER = "I";
  public static final int UNSET = -1;

  @VisibleForTesting
  public static final String PROP_TEXT = "text";

  public static final String PROP_SHADOW_OFFSET = "textShadowOffset";
  public static final String PROP_SHADOW_RADIUS = "textShadowRadius";
  public static final String PROP_SHADOW_COLOR = "textShadowColor";
  public static final int DEFAULT_TEXT_SHADOW_COLOR = 0x55000000;

  private static final TextPaint sTextPaintInstance = new TextPaint();

  static {
    sTextPaintInstance.setFlags(TextPaint.ANTI_ALIAS_FLAG);
  }

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
      ReactTextShadowNode textCSSNode,
      SpannableStringBuilder sb,
      List<SetSpanOperation> ops) {
    int start = sb.length();
    if (textCSSNode.mText != null) {
      sb.append(textCSSNode.mText);
    }
    for (int i = 0, length = textCSSNode.getChildCount(); i < length; i++) {
      CSSNode child = textCSSNode.getChildAt(i);
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
      ((ReactShadowNode) child).markUpdateSeen();
    }
    int end = sb.length();
    if (end >= start) {
      if (textCSSNode.mIsColorSet) {
        ops.add(new SetSpanOperation(start, end, new ForegroundColorSpan(textCSSNode.mColor)));
      }
      if (textCSSNode.mIsBackgroundColorSet) {
        ops.add(new SetSpanOperation(
                start,
                end,
                new BackgroundColorSpan(textCSSNode.mBackgroundColor)));
      }
      if (textCSSNode.mFontSize != UNSET) {
        ops.add(new SetSpanOperation(start, end, new AbsoluteSizeSpan(textCSSNode.mFontSize)));
      }
      if (textCSSNode.mFontStyle != UNSET ||
          textCSSNode.mFontWeight != UNSET ||
          textCSSNode.mFontFamily != null) {
        ops.add(new SetSpanOperation(
                start,
                end,
                new CustomStyleSpan(
                    textCSSNode.mFontStyle,
                    textCSSNode.mFontWeight,
                    textCSSNode.mFontFamily,
                    textCSSNode.getThemedContext().getAssets())));
      }
      if (textCSSNode.mTextShadowOffsetDx != 0 || textCSSNode.mTextShadowOffsetDy != 0) {
        ops.add(new SetSpanOperation(
                start,
                end,
                new ShadowStyleSpan(
                    textCSSNode.mTextShadowOffsetDx,
                    textCSSNode.mTextShadowOffsetDy,
                    textCSSNode.mTextShadowRadius,
                    textCSSNode.mTextShadowColor)));
      }
      ops.add(new SetSpanOperation(start, end, new ReactTagSpan(textCSSNode.getReactTag())));
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
          new AbsoluteSizeSpan((int) Math.ceil(PixelUtil.toPixelFromSP(ViewDefaults.FONT_SIZE_SP))),
          0,
          sb.length(),
          Spannable.SPAN_INCLUSIVE_EXCLUSIVE);
    }

    textCSSNode.mContainsImages = false;

    // While setting the Spans on the final text, we also check whether any of them are images
    for (int i = ops.size() - 1; i >= 0; i--) {
      SetSpanOperation op = ops.get(i);
      if (op.what instanceof TextInlineImageSpan) {
        textCSSNode.mContainsImages = true;
      }
      op.execute(sb);
    }
    return sb;
  }

  private static final CSSNode.MeasureFunction TEXT_MEASURE_FUNCTION =
      new CSSNode.MeasureFunction() {
        @Override
        public void measure(CSSNode node, float width, float height, MeasureOutput measureOutput) {
          // TODO(5578671): Handle text direction (see View#getTextDirectionHeuristic)
          ReactTextShadowNode reactCSSNode = (ReactTextShadowNode) node;
          TextPaint textPaint = sTextPaintInstance;
          Layout layout;
          Spanned text = Assertions.assertNotNull(
              reactCSSNode.mPreparedSpannableText,
              "Spannable element has not been prepared in onBeforeLayout");
          BoringLayout.Metrics boring = BoringLayout.isBoring(text, textPaint);
          float desiredWidth = boring == null ?
              Layout.getDesiredWidth(text, textPaint) : Float.NaN;

          // technically, width should never be negative, but there is currently a bug in
          // LayoutEngine where a negative value can be passed.
          boolean unconstrainedWidth = CSSConstants.isUndefined(width) || width < 0;

          if (boring == null &&
              (unconstrainedWidth ||
                  (!CSSConstants.isUndefined(desiredWidth) && desiredWidth <= width))) {
            // Is used when the width is not known and the text is not boring, ie. if it contains
            // unicode characters.
            layout = new StaticLayout(
                text,
                textPaint,
                (int) Math.ceil(desiredWidth),
                Layout.Alignment.ALIGN_NORMAL,
                1,
                0,
                true);
          } else if (boring != null && (unconstrainedWidth || boring.width <= width)) {
            // Is used for single-line, boring text when the width is either unknown or bigger
            // than the width of the text.
            layout = BoringLayout.make(
                text,
                textPaint,
                boring.width,
                Layout.Alignment.ALIGN_NORMAL,
                1,
                0,
                boring,
                true);
          } else {
            // Is used for multiline, boring text and the width is known.
            layout = new StaticLayout(
                text,
                textPaint,
                (int) width,
                Layout.Alignment.ALIGN_NORMAL,
                1,
                0,
                true);
          }

          measureOutput.height = layout.getHeight();
          measureOutput.width = layout.getWidth();
          if (reactCSSNode.mNumberOfLines != UNSET &&
              reactCSSNode.mNumberOfLines < layout.getLineCount()) {
            measureOutput.height = layout.getLineBottom(reactCSSNode.mNumberOfLines - 1);
          }
          if (reactCSSNode.mLineHeight != UNSET) {
            int lines = reactCSSNode.mNumberOfLines != UNSET
                ? Math.min(reactCSSNode.mNumberOfLines, layout.getLineCount())
                : layout.getLineCount();
            float lineHeight = PixelUtil.toPixelFromSP(reactCSSNode.mLineHeight);
            measureOutput.height = lineHeight * lines;
          }
        }
      };

  /**
   * Return -1 if the input string is not a valid numeric fontWeight (100, 200, ..., 900), otherwise
   * return the weight.
   */
  private static int parseNumericFontWeight(String fontWeightString) {
    // This should be much faster than using regex to verify input and Integer.parseInt
    return fontWeightString.length() == 3 && fontWeightString.endsWith("00")
        && fontWeightString.charAt(0) <= '9' && fontWeightString.charAt(0) >= '1' ?
        100 * (fontWeightString.charAt(0) - '0') : -1;
  }

  private int mLineHeight = UNSET;
  private boolean mIsColorSet = false;
  private int mColor;
  private boolean mIsBackgroundColorSet = false;
  private int mBackgroundColor;

  protected int mNumberOfLines = UNSET;
  protected int mFontSize = UNSET;

  private float mTextShadowOffsetDx = 0;
  private float mTextShadowOffsetDy = 0;
  private float mTextShadowRadius = 1;
  private int mTextShadowColor = DEFAULT_TEXT_SHADOW_COLOR;

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
  private final boolean mIsVirtual;

  protected boolean mContainsImages = false;

  public ReactTextShadowNode(boolean isVirtual) {
    mIsVirtual = isVirtual;
    if (!isVirtual) {
      setMeasureFunction(TEXT_MEASURE_FUNCTION);
    }
  }

  @Override
  public void onBeforeLayout() {
    if (mIsVirtual) {
      return;
    }
    mPreparedSpannableText = fromTextCSSNode(this);
    markUpdated();
  }

  @Override
  protected void markUpdated() {
    super.markUpdated();
    // We mark virtual anchor node as dirty as updated text needs to be re-measured
    if (!mIsVirtual) {
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
    mNumberOfLines = numberOfLines;
    markUpdated();
  }

  @ReactProp(name = ViewProps.LINE_HEIGHT, defaultInt = UNSET)
  public void setLineHeight(int lineHeight) {
    mLineHeight = lineHeight;
    markUpdated();
  }

  @ReactProp(name = ViewProps.FONT_SIZE, defaultFloat = UNSET)
  public void setFontSize(float fontSize) {
    if (fontSize != UNSET) {
      fontSize = (float) Math.ceil(PixelUtil.toPixelFromSP(fontSize));
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

  @ReactProp(name = PROP_SHADOW_OFFSET)
  public void setTextShadowOffset(ReadableMap offsetMap) {
    if (offsetMap == null) {
      mTextShadowOffsetDx = 0;
      mTextShadowOffsetDy = 0;
    } else {
      mTextShadowOffsetDx = PixelUtil.toPixelFromDIP(offsetMap.getDouble("width"));
      mTextShadowOffsetDy = PixelUtil.toPixelFromDIP(offsetMap.getDouble("height"));
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
    return !mIsVirtual;
  }

  @Override
  public boolean isVirtual() {
    return mIsVirtual;
  }

  @Override
  public void onCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue) {
    if (mIsVirtual) {
      return;
    }
    super.onCollectExtraUpdates(uiViewOperationQueue);
    if (mPreparedSpannableText != null) {
      ReactTextUpdate reactTextUpdate =
          new ReactTextUpdate(mPreparedSpannableText, UNSET, mContainsImages);
      uiViewOperationQueue.enqueueUpdateExtraData(getReactTag(), reactTextUpdate);
    }
  }
}

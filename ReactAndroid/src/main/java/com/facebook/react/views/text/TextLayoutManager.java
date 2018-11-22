/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import static com.facebook.react.views.text.TextAttributeProps.UNSET;

import android.content.Context;
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
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.yoga.YogaConstants;
import com.facebook.yoga.YogaMeasureMode;
import java.awt.font.TextAttribute;
import java.util.ArrayList;
import java.util.List;

/**
 * Class responsible of creating {@link Spanned} object for the JS representation of Text
 */
public class TextLayoutManager {

  // It's important to pass the ANTI_ALIAS_FLAG flag to the constructor rather than setting it
  // later by calling setFlags. This is because the latter approach triggers a bug on Android 4.4.2.
  // The bug is that unicode emoticons aren't measured properly which causes text to be clipped.
  private static final TextPaint sTextPaintInstance = new TextPaint(TextPaint.ANTI_ALIAS_FLAG);

  private static void buildSpannedFromShadowNode(
    Context context,
    ReadableArray fragments,
    SpannableStringBuilder sb,
    List<SetSpanOperation> ops) {

    for (int i = 0, length = fragments.size(); i < length; i++) {
      ReadableMap fragment = fragments.getMap(i);
      int start = sb.length();

      //ReactRawText
      sb.append(fragment.getString("string"));

// TODO: add support for TextInlineImage and BaseText
//      if (child instanceof ReactRawTextShadowNode) {
//        sb.append(((ReactRawTextShadowNode) child).getText());
//      } else if (child instanceof ReactBaseTextShadowNode) {
//        buildSpannedFromShadowNode((ReactBaseTextShadowNode) child, sb, ops);
//      } else if (child instanceof ReactTextInlineImageShadowNode) {
//        // We make the image take up 1 character in the span and put a corresponding character into
//        // the text so that the image doesn't run over any following text.
//        sb.append(INLINE_IMAGE_PLACEHOLDER);
//        ops.add(
//          new SetSpanOperation(
//            sb.length() - INLINE_IMAGE_PLACEHOLDER.length(),
//            sb.length(),
//            ((ReactTextInlineImageShadowNode) child).buildInlineImageSpan()));
//      } else {
//        throw new IllegalViewOperationException(
//          "Unexpected view type nested under text node: " + child.getClass());
//      }

      TextAttributeProps textAttributes = new TextAttributeProps(new ReactStylesDiffMap(fragment.getMap("textAttributes")));
      int end = sb.length();
      if (end >= start) {
        if (textAttributes.mIsColorSet) {
          ops.add(new SetSpanOperation(start, end, new ForegroundColorSpan(textAttributes.mColor)));
        }
        if (textAttributes.mIsBackgroundColorSet) {
          ops.add(
            new SetSpanOperation(
              start, end, new BackgroundColorSpan(textAttributes.mBackgroundColor)));
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
          if (!Float.isNaN(textAttributes.mLetterSpacing)) {
            ops.add(new SetSpanOperation(
              start,
              end,
              new CustomLetterSpacingSpan(textAttributes.mLetterSpacing)));
          }
        }
        ops.add(
          new SetSpanOperation(
            start, end, new AbsoluteSizeSpan(textAttributes.mFontSize)));
        if (textAttributes.mFontStyle != UNSET
          || textAttributes.mFontWeight != UNSET
          || textAttributes.mFontFamily != null) {
          ops.add(
            new SetSpanOperation(
              start,
              end,
              new CustomStyleSpan(
                textAttributes.mFontStyle,
                textAttributes.mFontWeight,
                textAttributes.mFontFamily,
                context.getAssets())));
        }
        if (textAttributes.mIsUnderlineTextDecorationSet) {
          ops.add(new SetSpanOperation(start, end, new UnderlineSpan()));
        }
        if (textAttributes.mIsLineThroughTextDecorationSet) {
          ops.add(new SetSpanOperation(start, end, new StrikethroughSpan()));
        }
        if (textAttributes.mTextShadowOffsetDx != 0 || textAttributes.mTextShadowOffsetDy != 0) {
          ops.add(
            new SetSpanOperation(
              start,
              end,
              new ShadowStyleSpan(
                textAttributes.mTextShadowOffsetDx,
                textAttributes.mTextShadowOffsetDy,
                textAttributes.mTextShadowRadius,
                textAttributes.mTextShadowColor)));
        }
        if (!Float.isNaN(textAttributes.getEffectiveLineHeight())) {
          ops.add(
            new SetSpanOperation(
              start, end, new CustomLineHeightSpan(textAttributes.getEffectiveLineHeight())));
        }
        if (textAttributes.mTextTransform != TextTransform.UNSET && textAttributes.mTextTransform != TextTransform.NONE) {
          ops.add(
            new SetSpanOperation(
              start,
              end,
              new CustomTextTransformSpan(textAttributes.mTextTransform)));
        }

        int reactTag = fragment.getInt("reactTag");
        ops.add(new SetSpanOperation(start, end, new ReactTagSpan(reactTag)));
      }
    }
  }

  protected static Spannable spannedFromTextFragments(
    Context context,
    ReadableArray fragments, String text) {
    SpannableStringBuilder sb = new SpannableStringBuilder();

    // TODO(5837930): Investigate whether it's worth optimizing this part and do it if so

    // The {@link SpannableStringBuilder} implementation require setSpan operation to be called
    // up-to-bottom, otherwise all the spannables that are withing the region for which one may set
    // a new spannable will be wiped out
    List<SetSpanOperation> ops = new ArrayList<>();

    buildSpannedFromShadowNode(context, fragments, sb, ops);

// TODO T31905686: add support for inline Images
//    textShadowNode.mContainsImages = false;
//    textShadowNode.mHeightOfTallestInlineImage = Float.NaN;

    // While setting the Spans on the final text, we also check whether any of them are images.
    int priority = 0;
    for (SetSpanOperation op : ops) {
// TODO T31905686: add support for TextInlineImage in C++
//      if (op.what instanceof TextInlineImageSpan) {
//        int height = ((TextInlineImageSpan) op.what).getHeight();
//        textShadowNode.mContainsImages = true;
//        if (Float.isNaN(textShadowNode.mHeightOfTallestInlineImage)
//          || height > textShadowNode.mHeightOfTallestInlineImage) {
//          textShadowNode.mHeightOfTallestInlineImage = height;
//        }
//      }

      // Actual order of calling {@code execute} does NOT matter,
      // but the {@code priority} DOES matter.
      op.execute(sb, priority);
      priority++;
    }

    return sb;
  }

  public static float[] measureText(
    ReactContext context,
    ReactTextView view,
    ReadableNativeMap attributedString,
    ReadableNativeMap paragraphAttributes,
    float width,
    YogaMeasureMode widthYogaMeasureMode,
    float height,
    YogaMeasureMode heightYogaMeasureMode) {

    // TODO(5578671): Handle text direction (see View#getTextDirectionHeuristic)
    TextPaint textPaint = sTextPaintInstance;
    Layout layout;

    Spannable preparedSpannableText = view == null ? null : view.getSpanned();

    // TODO add these props to paragraph attributes
    int textBreakStrategy = Layout.BREAK_STRATEGY_HIGH_QUALITY;
    boolean includeFontPadding = true;

    if (preparedSpannableText == null) {
      preparedSpannableText = spannedFromTextFragments(context, attributedString.getArray("fragments"), attributedString.getString("string"));
    }

    if (preparedSpannableText == null) {
      throw new IllegalStateException("Spannable element has not been prepared in onBeforeLayout");
    }
    Spanned text = preparedSpannableText;
    BoringLayout.Metrics boring = BoringLayout.isBoring(text, textPaint);
    float desiredWidth = boring == null ?
      Layout.getDesiredWidth(text, textPaint) : Float.NaN;

    // technically, width should never be negative, but there is currently a bug in
    boolean unconstrainedWidth = widthYogaMeasureMode == YogaMeasureMode.UNDEFINED || width < 0;

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
          includeFontPadding);
      } else {
        layout = StaticLayout.Builder.obtain(text, 0, text.length(), textPaint, hintWidth)
          .setAlignment(Layout.Alignment.ALIGN_NORMAL)
          .setLineSpacing(0.f, 1.f)
          .setIncludePad(includeFontPadding)
          .setBreakStrategy(textBreakStrategy)
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
        includeFontPadding);
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
          includeFontPadding);
      } else {
        layout = StaticLayout.Builder.obtain(text, 0, text.length(), textPaint, (int) width)
          .setAlignment(Layout.Alignment.ALIGN_NORMAL)
          .setLineSpacing(0.f, 1.f)
          .setIncludePad(includeFontPadding)
          .setBreakStrategy(textBreakStrategy)
          .setHyphenationFrequency(Layout.HYPHENATION_FREQUENCY_NORMAL)
          .build();
      }
    }

    int maximumNumberOfLines = paragraphAttributes.hasKey("maximumNumberOfLines") ? paragraphAttributes.getInt("maximumNumberOfLines") : UNSET;

    width = layout.getWidth();
    if (maximumNumberOfLines != UNSET
      && maximumNumberOfLines != 0
      && maximumNumberOfLines < layout.getLineCount()) {
      height = layout.getLineBottom(maximumNumberOfLines - 1);
    } else {
      height = layout.getHeight();
    }

    return new float[] { PixelUtil.toSPFromPixel(width), PixelUtil.toSPFromPixel(height) };
  }

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
}

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
import android.util.LruCache;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.yoga.YogaConstants;
import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureOutput;
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

  // Specifies the amount of spannable that are stored into the {@link sSpannableCache}.
  private static final int spannableCacheSize = 100;

  private static final Object sSpannableCacheLock = new Object();
  private static LruCache<String, Spannable> sSpannableCache = new LruCache<>(spannableCacheSize);

  private static void buildSpannableFromFragment(
      Context context,
      ReadableArray fragments,
      SpannableStringBuilder sb,
      List<SetSpanOperation> ops) {

    for (int i = 0, length = fragments.size(); i < length; i++) {
      ReadableMap fragment = fragments.getMap(i);
      int start = sb.length();

      // ReactRawText
      TextAttributeProps textAttributes = new TextAttributeProps(new ReactStylesDiffMap(fragment.getMap("textAttributes")));

      sb.append(TextTransform.apply(
          fragment.getString("string"),
          textAttributes.mTextTransform));

      // TODO: add support for TextInlineImage and BaseText

      int end = sb.length();
      if (end >= start) {
        if (textAttributes.mIsColorSet) {
          ops.add(new SetSpanOperation(start, end, new ReactForegroundColorSpan(textAttributes.mColor)));
        }
        if (textAttributes.mIsBackgroundColorSet) {
          ops.add(
            new SetSpanOperation(
              start, end, new ReactBackgroundColorSpan(textAttributes.mBackgroundColor)));
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
            start, end, new ReactAbsoluteSizeSpan(textAttributes.mFontSize)));
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
          ops.add(new SetSpanOperation(start, end, new ReactUnderlineSpan()));
        }
        if (textAttributes.mIsLineThroughTextDecorationSet) {
          ops.add(new SetSpanOperation(start, end, new ReactStrikethroughSpan()));
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

        int reactTag = fragment.getInt("reactTag");
        ops.add(new SetSpanOperation(start, end, new ReactTagSpan(reactTag)));
      }
    }
  }

  protected static Spannable getOrCreateSpannableForText(
      Context context,
      ReadableMap attributedString) {

    Spannable preparedSpannableText;
    String attributedStringPayload = attributedString.toString();
    synchronized (sSpannableCacheLock) {
      preparedSpannableText = sSpannableCache.get(attributedStringPayload);
      //TODO: T31905686 implement proper equality of attributedStrings
      if (preparedSpannableText != null) {
        return preparedSpannableText;
      }
    }

    preparedSpannableText = createSpannableFromAttributedString(context, attributedString);
    synchronized (sSpannableCacheLock) {
      sSpannableCache.put(attributedStringPayload, preparedSpannableText);
    }
    return preparedSpannableText;
  }

  private static Spannable createSpannableFromAttributedString(
      Context context,
      ReadableMap attributedString) {

    SpannableStringBuilder sb = new SpannableStringBuilder();

    // The {@link SpannableStringBuilder} implementation require setSpan operation to be called
    // up-to-bottom, otherwise all the spannables that are withing the region for which one may set
    // a new spannable will be wiped out
    List<SetSpanOperation> ops = new ArrayList<>();

    buildSpannableFromFragment(context, attributedString.getArray("fragments"), sb, ops);

    // TODO T31905686: add support for inline Images
    // While setting the Spans on the final text, we also check whether any of them are images.
    int priority = 0;
    for (SetSpanOperation op : ops) {
      // Actual order of calling {@code execute} does NOT matter,
      // but the {@code priority} DOES matter.
      op.execute(sb, priority);
      priority++;
    }

    return sb;
  }

  public static long measureText(
      Context context,
      ReadableMap attributedString,
      ReadableMap paragraphAttributes,
      float width,
      YogaMeasureMode widthYogaMeasureMode,
      float height,
      YogaMeasureMode heightYogaMeasureMode) {

    // TODO(5578671): Handle text direction (see View#getTextDirectionHeuristic)
    TextPaint textPaint = sTextPaintInstance;
    Spannable preparedSpannableText = getOrCreateSpannableForText(context, attributedString);

    // TODO add these props to paragraph attributes
    int textBreakStrategy = Layout.BREAK_STRATEGY_HIGH_QUALITY;
    boolean includeFontPadding = true;

    if (preparedSpannableText == null) {
      throw new IllegalStateException("Spannable element has not been prepared in onBeforeLayout");
    }
    Spanned text = preparedSpannableText;
    BoringLayout.Metrics boring = BoringLayout.isBoring(text, textPaint);
    float desiredWidth = boring == null ?
      Layout.getDesiredWidth(text, textPaint) : Float.NaN;

    // technically, width should never be negative, but there is currently a bug in
    boolean unconstrainedWidth = widthYogaMeasureMode == YogaMeasureMode.UNDEFINED || width < 0;

    Layout layout;
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

    int maximumNumberOfLines =
        paragraphAttributes.hasKey("maximumNumberOfLines")
            ? paragraphAttributes.getInt("maximumNumberOfLines")
            : UNSET;

    width = layout.getWidth();
    if (maximumNumberOfLines != UNSET
      && maximumNumberOfLines != 0
      && maximumNumberOfLines < layout.getLineCount()) {
      height = layout.getLineBottom(maximumNumberOfLines - 1);
    } else {
      height = layout.getHeight();
    }

    return YogaMeasureOutput.make(PixelUtil.toSPFromPixel(width), PixelUtil.toSPFromPixel(height));
  }

  // TODO T31905686: This class should be private
  public static class SetSpanOperation {
    protected int start, end;
    protected ReactSpan what;

    SetSpanOperation(int start, int end, ReactSpan what) {
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

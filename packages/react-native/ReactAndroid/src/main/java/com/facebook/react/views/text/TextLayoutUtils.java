/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.content.Context;
import android.graphics.Color;
import android.text.*;
import android.view.View;
import com.facebook.react.common.assets.ReactFontManager;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactAccessibilityDelegate;
import com.facebook.react.views.text.fragments.TextFragment;
import com.facebook.react.views.text.fragments.TextFragmentList;

import java.util.List;

/**
 * Class containing static methods for building {@link Spannable}s
 */
public class TextLayoutUtils {
  private static final String INLINE_VIEW_PLACEHOLDER = "0";
  private static final int UNSET = ReactFontManager.TypefaceStyle.UNSET;

  public static void buildSpannableFromTextFragmentList(Context context, TextFragmentList textFragmentList,
                                                        SpannableStringBuilder sb, List<SetSpanOperation> ops) {

    for (int i = 0, length = textFragmentList.getCount(); i < length; i++) {
      final TextFragment fragment = textFragmentList.getFragment(i);
      int start = sb.length();

      // ReactRawText
      TextAttributeProps textAttributes = fragment.getTextAttributeProps();

      TextLayoutUtils.addText(sb, fragment.getString(), textAttributes);

      int end = sb.length();
      int reactTag = fragment.hasReactTag() ? fragment.getReactTag() : View.NO_ID;
      if (fragment.hasIsAttachment() && fragment.isAttachment()) {
        float width = PixelUtil.toPixelFromSP(fragment.getWidth());
        float height = PixelUtil.toPixelFromSP(fragment.getHeight());

        addInlineViewPlaceholderSpan(ops, sb, reactTag, width, height);
      } else if (end >= start) {
        addApplicableTextAttributeSpans(ops, textAttributes, reactTag, context, start, end);
      }
    }
  }

  public static void addText(SpannableStringBuilder sb, String text,
                             EffectiveTextAttributeProvider textAttributeProvider) {
    sb.append(TextTransform.apply(text, textAttributeProvider.getTextTransform()));
  }

  public static void addInlineViewPlaceholderSpan(List<SetSpanOperation> ops, SpannableStringBuilder sb, int reactTag
    , float width, float height) {
    ops.add(new SetSpanOperation(sb.length() - INLINE_VIEW_PLACEHOLDER.length(), sb.length(),
      new TextInlineViewPlaceholderSpan(reactTag, (int) width, (int) height)));
  }

  public static void addApplicableTextAttributeSpans(List<SetSpanOperation> ops,
                                             EffectiveTextAttributeProvider textAttributeProvider, int reactTag, Context context,
                                             int start, int end) {
    addColorSpanIfApplicable(ops, textAttributeProvider, start, end);

    addBackgroundColorSpanIfApplicable(ops, textAttributeProvider, start, end);

    addLinkSpanIfApplicable(ops, textAttributeProvider, reactTag, start, end);

    addLetterSpacingSpanIfApplicable(ops, textAttributeProvider, start, end);

    addFontSizeSpanIfApplicable(ops, textAttributeProvider, start, end);

    addCustomStyleSpanIfApplicable(ops, textAttributeProvider, context, start, end);

    addUnderlineSpanIfApplicable(ops, textAttributeProvider, start, end);

    addStrikethroughSpanIfApplicable(ops, textAttributeProvider, start, end);

    addShadowStyleSpanIfApplicable(ops, textAttributeProvider, start, end);

    addLineHeightSpanIfApplicable(ops, textAttributeProvider, start, end);

    addReactTagSpan(ops, start, end, reactTag);
  }

  private static void addLinkSpanIfApplicable(List<SetSpanOperation> ops,
                                             EffectiveTextAttributeProvider textAttributeProvider, int reactTag,
                                             int start, int end) {
    boolean roleIsLink = textAttributeProvider.getRole() != null ?
      textAttributeProvider.getRole() == ReactAccessibilityDelegate.Role.LINK :
      textAttributeProvider.getAccessibilityRole() == ReactAccessibilityDelegate.AccessibilityRole.LINK;
    if (roleIsLink) {
      ops.add(new SetSpanOperation(start, end, new ReactClickableSpan(reactTag)));
    }
  }

  private static void addColorSpanIfApplicable(List<SetSpanOperation> ops,
                                              EffectiveTextAttributeProvider textAttributeProvider, int start,
                                              int end) {
    if (textAttributeProvider.isColorSet()) {
      ops.add(new SetSpanOperation(start, end, new ReactForegroundColorSpan(textAttributeProvider.getColor())));
    }
  }

  private static void addBackgroundColorSpanIfApplicable(List<SetSpanOperation> ops,
                                                        EffectiveTextAttributeProvider textAttributeProvider,
                                                        int start, int end) {
    if (textAttributeProvider.isBackgroundColorSet()) {
      ops.add(new SetSpanOperation(start, end,
        new ReactBackgroundColorSpan(textAttributeProvider.getBackgroundColor())));
    }
  }

  private static void addLetterSpacingSpanIfApplicable(List<SetSpanOperation> ops,
                                                      EffectiveTextAttributeProvider textAttributeProvider, int start
    , int end) {
    final float effectiveLetterSpacing = textAttributeProvider.getEffectiveLetterSpacing();

    if (!Float.isNaN(effectiveLetterSpacing)) {
      ops.add(new SetSpanOperation(start, end, new CustomLetterSpacingSpan(effectiveLetterSpacing)));
    }
  }


  private static void addFontSizeSpanIfApplicable(List<SetSpanOperation> ops,
                                                 EffectiveTextAttributeProvider textAttributeProvider, int start,
                                                 int end) {
    final int effectiveFontSize = textAttributeProvider.getEffectiveFontSize();

    if (effectiveFontSize != UNSET) {
      ops.add(new SetSpanOperation(start, end, new ReactAbsoluteSizeSpan(effectiveFontSize)));
    }
  }

  private static void addCustomStyleSpanIfApplicable(List<SetSpanOperation> ops,
                                                    EffectiveTextAttributeProvider textAttributeProvider,
                                                    Context context, int start, int end) {
    final int fontStyle = textAttributeProvider.getFontStyle();
    final int fontWeight = textAttributeProvider.getFontWeight();
    final String fontFamily = textAttributeProvider.getFontFamily();

    if (fontStyle != UNSET || fontWeight != UNSET || fontFamily != null) {
      ops.add(new SetSpanOperation(start, end, new CustomStyleSpan(fontStyle,
        fontWeight, textAttributeProvider.getFontFeatureSettings(),
        fontFamily, context.getAssets())));
    }
  }

  private static void addUnderlineSpanIfApplicable(List<SetSpanOperation> ops,
                                                  EffectiveTextAttributeProvider textAttributeProvider, int start,
                                                  int end) {
    if (textAttributeProvider.isUnderlineTextDecorationSet()) {
      ops.add(new SetSpanOperation(start, end, new ReactUnderlineSpan()));
    }
  }

  private static void addStrikethroughSpanIfApplicable(List<SetSpanOperation> ops,
                                                      EffectiveTextAttributeProvider textAttributeProvider, int start
    , int end) {
    if (textAttributeProvider.isLineThroughTextDecorationSet()) {
      ops.add(new SetSpanOperation(start, end, new ReactStrikethroughSpan()));
    }
  }


  private static void addShadowStyleSpanIfApplicable(List<SetSpanOperation> ops,
                                                    EffectiveTextAttributeProvider textAttributeProvider, int start,
                                                    int end) {
    if ((textAttributeProvider.getTextShadowOffsetDx() != 0 || textAttributeProvider.getTextShadowOffsetDy() != 0 || textAttributeProvider.getTextShadowRadius() != 0) && Color.alpha(textAttributeProvider.getTextShadowColor()) != 0) {
      ops.add(new SetSpanOperation(start, end, new ShadowStyleSpan(textAttributeProvider.getTextShadowOffsetDx(),
        textAttributeProvider.getTextShadowOffsetDy(), textAttributeProvider.getTextShadowRadius(),
        textAttributeProvider.getTextShadowColor())));
    }
  }

  private static void addLineHeightSpanIfApplicable(List<SetSpanOperation> ops,
                                                   EffectiveTextAttributeProvider textAttributeProvider, int start,
                                                   int end) {
    final float effectiveLineHeight = textAttributeProvider.getEffectiveLineHeight();
    if (!Float.isNaN(effectiveLineHeight)) {
      ops.add(new SetSpanOperation(start, end, new CustomLineHeightSpan(effectiveLineHeight)));
    }
  }

  private static void addReactTagSpan(List<SetSpanOperation> ops, int start, int end, int reactTag) {
    ops.add(new SetSpanOperation(start, end, new ReactTagSpan(reactTag)));

  }
}

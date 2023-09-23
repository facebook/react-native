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
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.Role;
import com.facebook.react.views.text.fragments.TextFragment;
import com.facebook.react.views.text.fragments.TextFragmentList;

import java.util.List;

import static com.facebook.react.views.text.TextAttributeProps.UNSET;

public class TextLayoutUtils {
  private static final String INLINE_VIEW_PLACEHOLDER = "0";

  public static void buildSpannableFromTextFragmentList(
    Context context,
    TextFragmentList textFragmentList,
    SpannableStringBuilder sb,
    List<SetSpanOperation> ops) {

    for (int i = 0, length = textFragmentList.getCount(); i < length; i++) {
      final TextFragment fragment = textFragmentList.getFragment(i);
      int start = sb.length();

      // ReactRawText
      TextAttributeProps textAttributes = fragment.getTextAttributeProps();

      sb.append(TextTransform.apply(fragment.getString(), textAttributes.mTextTransform));

      int end = sb.length();
      int reactTag = fragment.hasReactTag() ? fragment.getReactTag() : View.NO_ID;
      if (fragment.hasIsAttachment()
        && fragment.isAttachment()) {
        float width = PixelUtil.toPixelFromSP(fragment.getWidth());
        float height = PixelUtil.toPixelFromSP(fragment.getHeight());
        ops.add(
          new SetSpanOperation(
            sb.length() - INLINE_VIEW_PLACEHOLDER.length(),
            sb.length(),
            new TextInlineViewPlaceholderSpan(reactTag, (int) width, (int) height)));
      } else if (end >= start) {
        boolean roleIsLink =
          textAttributes.mRole != null
            ? textAttributes.mRole == Role.LINK
            : textAttributes.mAccessibilityRole == AccessibilityRole.LINK;
        if (roleIsLink) {
          ops.add(new SetSpanOperation(start, end, new ReactClickableSpan(reactTag)));
        }
        if (textAttributes.mIsColorSet) {
          ops.add(
            new SetSpanOperation(
              start, end, new ReactForegroundColorSpan(textAttributes.mColor)));
        }
        if (textAttributes.mIsBackgroundColorSet) {
          ops.add(
            new SetSpanOperation(
              start, end, new ReactBackgroundColorSpan(textAttributes.mBackgroundColor)));
        }
        if (!Float.isNaN(textAttributes.getLetterSpacing())) {
          ops.add(
            new SetSpanOperation(
              start, end, new CustomLetterSpacingSpan(textAttributes.getLetterSpacing())));
        }
        ops.add(
          new SetSpanOperation(start, end, new ReactAbsoluteSizeSpan(textAttributes.mFontSize)));
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
                textAttributes.mFontFeatureSettings,
                textAttributes.mFontFamily,
                context.getAssets())));
        }
        if (textAttributes.mIsUnderlineTextDecorationSet) {
          ops.add(new SetSpanOperation(start, end, new ReactUnderlineSpan()));
        }
        if (textAttributes.mIsLineThroughTextDecorationSet) {
          ops.add(new SetSpanOperation(start, end, new ReactStrikethroughSpan()));
        }
        if ((textAttributes.mTextShadowOffsetDx != 0
          || textAttributes.mTextShadowOffsetDy != 0
          || textAttributes.mTextShadowRadius != 0)
          && Color.alpha(textAttributes.mTextShadowColor) != 0) {
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

        ops.add(new SetSpanOperation(start, end, new ReactTagSpan(reactTag)));
      }
    }
  }
}

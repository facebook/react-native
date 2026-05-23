/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBackedTextInputViewLineHeightUtils.h"

static BOOL RCTNeedsLineHeightStrip(NSDictionary<NSAttributedStringKey, id> *attributes)
{
  UIFont *font = attributes[NSFontAttributeName];
  NSParagraphStyle *paragraphStyle = attributes[NSParagraphStyleAttributeName];
  return font && paragraphStyle && paragraphStyle.maximumLineHeight > font.lineHeight;
}

NSDictionary<NSAttributedStringKey, id> *RCTStripDefaultTextAttributesLineHeight(
    NSDictionary<NSAttributedStringKey, id> *defaultTextAttributes)
{
  if (!RCTNeedsLineHeightStrip(defaultTextAttributes)) {
    return defaultTextAttributes;
  }
  NSMutableDictionary<NSAttributedStringKey, id> *stripped = [defaultTextAttributes mutableCopy];
  NSMutableParagraphStyle *strippedStyle = [defaultTextAttributes[NSParagraphStyleAttributeName] mutableCopy];
  strippedStyle.minimumLineHeight = 0;
  strippedStyle.maximumLineHeight = 0;
  stripped[NSParagraphStyleAttributeName] = strippedStyle;
  return stripped;
}

void RCTStripAttributedStringLineHeights(NSMutableAttributedString *attributedString)
{
  [attributedString
      enumerateAttribute:NSParagraphStyleAttributeName
                 inRange:NSMakeRange(0, attributedString.length)
                 options:0
              usingBlock:^(NSParagraphStyle *style, NSRange range, __unused BOOL *stop) {
                if (!style || (style.maximumLineHeight == 0 && style.minimumLineHeight == 0)) {
                  return;
                }
                NSMutableParagraphStyle *stripped = [style mutableCopy];
                stripped.minimumLineHeight = 0;
                stripped.maximumLineHeight = 0;
                [attributedString addAttribute:NSParagraphStyleAttributeName value:stripped range:range];
              }];
}

void RCTApplyPlaceholderBaselineOffset(NSMutableDictionary<NSAttributedStringKey, id> *placeholderAttributes)
{
  if (!RCTNeedsLineHeightStrip(placeholderAttributes)) {
    return;
  }
  NSParagraphStyle *paragraphStyle = placeholderAttributes[NSParagraphStyleAttributeName];
  UIFont *font = placeholderAttributes[NSFontAttributeName];
  placeholderAttributes[NSBaselineOffsetAttributeName] =
      @((paragraphStyle.maximumLineHeight - font.lineHeight) / 2.0);
}

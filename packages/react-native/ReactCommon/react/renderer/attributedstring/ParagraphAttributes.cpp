/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphAttributes.h"

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#include <react/utils/FloatComparison.h>

namespace facebook::react {

bool ParagraphAttributes::operator==(const ParagraphAttributes& rhs) const {
  return std::tie(
             maximumNumberOfLines,
             ellipsizeMode,
             textBreakStrategy,
             adjustsFontSizeToFit,
             includeFontPadding,
             android_hyphenationFrequency) ==
      std::tie(
             rhs.maximumNumberOfLines,
             rhs.ellipsizeMode,
             rhs.textBreakStrategy,
             rhs.adjustsFontSizeToFit,
             rhs.includeFontPadding,
             rhs.android_hyphenationFrequency) &&
      floatEquality(minimumFontSize, rhs.minimumFontSize) &&
      floatEquality(maximumFontSize, rhs.maximumFontSize);
}

bool ParagraphAttributes::operator!=(const ParagraphAttributes& rhs) const {
  return !(*this == rhs);
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ParagraphAttributes::getDebugProps() const {
  ParagraphAttributes paragraphAttributes{};
  return {
      debugStringConvertibleItem(
          "maximumNumberOfLines",
          maximumNumberOfLines,
          paragraphAttributes.maximumNumberOfLines),
      debugStringConvertibleItem(
          "ellipsizeMode", ellipsizeMode, paragraphAttributes.ellipsizeMode),
      debugStringConvertibleItem(
          "textBreakStrategy",
          textBreakStrategy,
          paragraphAttributes.textBreakStrategy),
      debugStringConvertibleItem(
          "adjustsFontSizeToFit",
          adjustsFontSizeToFit,
          paragraphAttributes.adjustsFontSizeToFit),
      debugStringConvertibleItem(
          "minimumFontSize",
          minimumFontSize,
          paragraphAttributes.minimumFontSize),
      debugStringConvertibleItem(
          "maximumFontSize",
          maximumFontSize,
          paragraphAttributes.maximumFontSize),
      debugStringConvertibleItem(
          "includeFontPadding",
          includeFontPadding,
          paragraphAttributes.includeFontPadding),
      debugStringConvertibleItem(
          "android_hyphenationFrequency",
          android_hyphenationFrequency,
          paragraphAttributes.android_hyphenationFrequency)};
}
#endif

} // namespace facebook::react

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>

#include <folly/Hash.h>
#include <react/attributedstring/primitives.h>
#include <react/debug/DebugStringConvertible.h>
#include <react/graphics/Geometry.h>

namespace facebook {
namespace react {

class ParagraphAttributes;

using SharedParagraphAttributes = std::shared_ptr<const ParagraphAttributes>;

/*
 * Represents all visual attributes of a paragraph of text.
 * Two data structures, ParagraphAttributes and AttributedText, should be
 * enough to define visual representation of a piece of text on the screen.
 */
class ParagraphAttributes : public DebugStringConvertible {
 public:
#pragma mark - Fields

  /*
   * Maximum number of lines which paragraph can take.
   * Zero value represents "no limit".
   */
  int maximumNumberOfLines{};

  /*
   * In case if a text cannot fit given boundaries, defines a place where
   * an ellipsize should be placed.
   */
  EllipsizeMode ellipsizeMode{};

  TextBreakStrategy textBreakStrategy{};

  /*
   * Enables font size adjustment to fit constrained boundaries.
   */
  bool adjustsFontSizeToFit{};

  /*
   * In case of font size adjustment enabled, defines minimum and maximum
   * font sizes.
   */
  Float minimumFontSize{std::numeric_limits<Float>::quiet_NaN()};
  Float maximumFontSize{std::numeric_limits<Float>::quiet_NaN()};

  bool operator==(const ParagraphAttributes &) const;
  bool operator!=(const ParagraphAttributes &) const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace react
} // namespace facebook

namespace std {

template <>
struct hash<facebook::react::ParagraphAttributes> {
  size_t operator()(
      const facebook::react::ParagraphAttributes &attributes) const {
    return folly::hash::hash_combine(
        0,
        attributes.maximumNumberOfLines,
        attributes.ellipsizeMode,
        attributes.textBreakStrategy,
        attributes.adjustsFontSizeToFit,
        attributes.minimumFontSize,
        attributes.maximumFontSize);
  }
};
} // namespace std

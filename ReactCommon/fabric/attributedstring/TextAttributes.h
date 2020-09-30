/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <limits>

#include <folly/Hash.h>
#include <folly/Optional.h>
#include <react/attributedstring/primitives.h>
#include <react/core/LayoutPrimitives.h>
#include <react/core/ReactPrimitives.h>
#include <react/debug/DebugStringConvertible.h>
#include <react/graphics/Color.h>
#include <react/graphics/Geometry.h>

namespace facebook {
namespace react {

class TextAttributes;

using SharedTextAttributes = std::shared_ptr<const TextAttributes>;

class TextAttributes : public DebugStringConvertible {
 public:
  /*
   * Returns TextAttribute object which has actual default attribute values
   * (e.g. `foregroundColor = black`), in oppose to TextAttribute's default
   * constructor which creates an object with nulled attributes.
   */
  static TextAttributes defaultTextAttributes();

#pragma mark - Fields

  // Color
  SharedColor foregroundColor{};
  SharedColor backgroundColor{};
  Float opacity{std::numeric_limits<Float>::quiet_NaN()};

  // Font
  std::string fontFamily{""};
  Float fontSize{std::numeric_limits<Float>::quiet_NaN()};
  Float fontSizeMultiplier{std::numeric_limits<Float>::quiet_NaN()};
  folly::Optional<FontWeight> fontWeight{};
  folly::Optional<FontStyle> fontStyle{};
  folly::Optional<FontVariant> fontVariant{};
  folly::Optional<bool> allowFontScaling{};
  Float letterSpacing{std::numeric_limits<Float>::quiet_NaN()};

  // Paragraph Styles
  Float lineHeight{std::numeric_limits<Float>::quiet_NaN()};
  folly::Optional<TextAlignment> alignment{};
  folly::Optional<WritingDirection> baseWritingDirection{};

  // Decoration
  SharedColor textDecorationColor{};
  folly::Optional<TextDecorationLineType> textDecorationLineType{};
  folly::Optional<TextDecorationLineStyle> textDecorationLineStyle{};
  folly::Optional<TextDecorationLinePattern> textDecorationLinePattern{};

  // Shadow
  // TODO: Use `Point` type instead of `Size` for `textShadowOffset` attribute.
  folly::Optional<Size> textShadowOffset{};
  Float textShadowRadius{std::numeric_limits<Float>::quiet_NaN()};
  SharedColor textShadowColor{};

  // Special
  folly::Optional<bool> isHighlighted{};
  folly::Optional<LayoutDirection> layoutDirection{};

#pragma mark - Operations

  void apply(TextAttributes textAttributes);

#pragma mark - Operators

  bool operator==(const TextAttributes &rhs) const;
  bool operator!=(const TextAttributes &rhs) const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace react
} // namespace facebook

namespace std {

template <>
struct hash<facebook::react::TextAttributes> {
  size_t operator()(
      const facebook::react::TextAttributes &textAttributes) const {
    return folly::hash::hash_combine(
        0,
        textAttributes.foregroundColor,
        textAttributes.backgroundColor,
        textAttributes.opacity,
        textAttributes.fontFamily,
        textAttributes.fontSize,
        textAttributes.fontSizeMultiplier,
        textAttributes.fontWeight,
        textAttributes.fontStyle,
        textAttributes.fontVariant,
        textAttributes.allowFontScaling,
        textAttributes.letterSpacing,
        textAttributes.lineHeight,
        textAttributes.alignment,
        textAttributes.baseWritingDirection,
        textAttributes.textDecorationColor,
        textAttributes.textDecorationLineType,
        textAttributes.textDecorationLineStyle,
        textAttributes.textDecorationLinePattern,
        textAttributes.textShadowOffset,
        textAttributes.textShadowRadius,
        textAttributes.textShadowColor,
        textAttributes.isHighlighted,
        textAttributes.layoutDirection);
  }
};
} // namespace std

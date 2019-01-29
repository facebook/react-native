/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <limits>

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
    return std::hash<decltype(textAttributes.foregroundColor)>{}(
               textAttributes.foregroundColor) +
        std::hash<decltype(textAttributes.backgroundColor)>{}(
               textAttributes.backgroundColor) +
        std::hash<decltype(textAttributes.opacity)>{}(textAttributes.opacity) +
        std::hash<decltype(textAttributes.fontFamily)>{}(
               textAttributes.fontFamily) +
        std::hash<decltype(textAttributes.fontSize)>{}(
               textAttributes.fontSize) +
        std::hash<decltype(textAttributes.fontSizeMultiplier)>{}(
               textAttributes.fontSizeMultiplier) +
        std::hash<decltype(textAttributes.fontWeight)>{}(
               textAttributes.fontWeight) +
        std::hash<decltype(textAttributes.fontStyle)>{}(
               textAttributes.fontStyle) +
        std::hash<decltype(textAttributes.fontVariant)>{}(
               textAttributes.fontVariant) +
        std::hash<decltype(textAttributes.allowFontScaling)>{}(
               textAttributes.allowFontScaling) +
        std::hash<decltype(textAttributes.letterSpacing)>{}(
               textAttributes.letterSpacing) +
        std::hash<decltype(textAttributes.lineHeight)>{}(
               textAttributes.lineHeight) +
        std::hash<decltype(textAttributes.alignment)>{}(
               textAttributes.alignment) +
        std::hash<decltype(textAttributes.baseWritingDirection)>{}(
               textAttributes.baseWritingDirection) +
        std::hash<decltype(textAttributes.textDecorationColor)>{}(
               textAttributes.textDecorationColor) +
        std::hash<decltype(textAttributes.textDecorationLineType)>{}(
               textAttributes.textDecorationLineType) +
        std::hash<decltype(textAttributes.textDecorationLineStyle)>{}(
               textAttributes.textDecorationLineStyle) +
        std::hash<decltype(textAttributes.textDecorationLinePattern)>{}(
               textAttributes.textDecorationLinePattern) +
        std::hash<decltype(textAttributes.textShadowOffset)>{}(
               textAttributes.textShadowOffset) +
        std::hash<decltype(textAttributes.textShadowRadius)>{}(
               textAttributes.textShadowRadius) +
        std::hash<decltype(textAttributes.textShadowColor)>{}(
               textAttributes.textShadowColor) +
        std::hash<decltype(textAttributes.isHighlighted)>{}(
               textAttributes.isHighlighted) +
        std::hash<decltype(textAttributes.layoutDirection)>{}(
               textAttributes.layoutDirection);
  }
};
} // namespace std

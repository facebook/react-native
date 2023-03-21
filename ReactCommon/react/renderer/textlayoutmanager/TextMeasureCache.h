/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/utils/FloatComparison.h>
#include <react/utils/SimpleThreadSafeCache.h>

namespace facebook {
namespace react {

struct LineMeasurement {
  std::string text;
  Rect frame;
  Float descender;
  Float capHeight;
  Float ascender;
  Float xHeight;

  LineMeasurement(
      std::string text,
      Rect frame,
      Float descender,
      Float capHeight,
      Float ascender,
      Float xHeight);

  LineMeasurement(folly::dynamic const &data);

  bool operator==(LineMeasurement const &rhs) const;
};

using LinesMeasurements = std::vector<LineMeasurement>;

/*
 * Describes a result of text measuring.
 */
class TextMeasurement final {
 public:
  class Attachment final {
   public:
    Rect frame;
    bool isClipped;
  };

  using Attachments = std::vector<Attachment>;

  Size size;
  Attachments attachments;
};

// The Key type that is used for Text Measure Cache.
// The equivalence and hashing operations of this are defined to respect the
// nature of text measuring.
class TextMeasureCacheKey final {
 public:
  AttributedString attributedString{};
  ParagraphAttributes paragraphAttributes{};
  LayoutConstraints layoutConstraints{};
};

/*
 * Maximum size of the Cache.
 * The number was empirically chosen based on approximation of an average amount
 * of meaningful measures per surface.
 */
constexpr auto kSimpleThreadSafeCacheSizeCap = size_t{1024};

/*
 * Thread-safe, evicting hash table designed to store text measurement
 * information.
 */
using TextMeasureCache = SimpleThreadSafeCache<
    TextMeasureCacheKey,
    TextMeasurement,
    kSimpleThreadSafeCacheSizeCap>;

inline bool areTextAttributesEquivalentLayoutWise(
    TextAttributes const &lhs,
    TextAttributes const &rhs) {
  // Here we check all attributes that affect layout metrics and don't check any
  // attributes that affect only a decorative aspect of displayed text (like
  // colors).
  return std::tie(
             lhs.fontFamily,
             lhs.fontWeight,
             lhs.fontStyle,
             lhs.fontVariant,
             lhs.allowFontScaling,
             lhs.alignment) ==
      std::tie(
             rhs.fontFamily,
             rhs.fontWeight,
             rhs.fontStyle,
             rhs.fontVariant,
             rhs.allowFontScaling,
             rhs.alignment) &&
      floatEquality(lhs.fontSize, rhs.fontSize) &&
      floatEquality(lhs.fontSizeMultiplier, rhs.fontSizeMultiplier) &&
      floatEquality(lhs.letterSpacing, rhs.letterSpacing) &&
      floatEquality(lhs.lineHeight, rhs.lineHeight);
}

inline size_t textAttributesHashLayoutWise(
    TextAttributes const &textAttributes) {
  // Taking into account the same props as
  // `areTextAttributesEquivalentLayoutWise` mentions.
  return folly::hash::hash_combine(
      0,
      textAttributes.fontFamily,
      textAttributes.fontSize,
      textAttributes.fontSizeMultiplier,
      textAttributes.fontWeight,
      textAttributes.fontStyle,
      textAttributes.fontVariant,
      textAttributes.allowFontScaling,
      textAttributes.letterSpacing,
      textAttributes.lineHeight,
      textAttributes.alignment);
}

inline bool areAttributedStringFragmentsEquivalentLayoutWise(
    AttributedString::Fragment const &lhs,
    AttributedString::Fragment const &rhs) {
  return lhs.string == rhs.string &&
      areTextAttributesEquivalentLayoutWise(
             lhs.textAttributes, rhs.textAttributes) &&
      // LayoutMetrics of an attachment fragment affects the size of a measured
      // attributed string.
      (!lhs.isAttachment() ||
       (lhs.parentShadowView.layoutMetrics ==
        rhs.parentShadowView.layoutMetrics));
}

inline size_t textAttributesHashLayoutWise(
    AttributedString::Fragment const &fragment) {
  // Here we are not taking `isAttachment` and `layoutMetrics` into account
  // because they are logically interdependent and this can break an invariant
  // between hash and equivalence functions (and cause cache misses).
  return folly::hash::hash_combine(
      0,
      fragment.string,
      textAttributesHashLayoutWise(fragment.textAttributes));
}

inline bool areAttributedStringsEquivalentLayoutWise(
    AttributedString const &lhs,
    AttributedString const &rhs) {
  auto &lhsFragment = lhs.getFragments();
  auto &rhsFragment = rhs.getFragments();

  if (lhsFragment.size() != rhsFragment.size()) {
    return false;
  }

  auto size = lhsFragment.size();
  for (auto i = size_t{0}; i < size; i++) {
    if (!areAttributedStringFragmentsEquivalentLayoutWise(
            lhsFragment.at(i), rhsFragment.at(i))) {
      return false;
    }
  }

  return true;
}

inline size_t textAttributedStringHashLayoutWise(
    AttributedString const &attributedString) {
  auto seed = size_t{0};

  for (auto const &fragment : attributedString.getFragments()) {
    seed =
        folly::hash::hash_combine(seed, textAttributesHashLayoutWise(fragment));
  }

  return seed;
}

inline bool operator==(
    TextMeasureCacheKey const &lhs,
    TextMeasureCacheKey const &rhs) {
  return areAttributedStringsEquivalentLayoutWise(
             lhs.attributedString, rhs.attributedString) &&
      lhs.paragraphAttributes == rhs.paragraphAttributes &&
      lhs.layoutConstraints.maximumSize.width ==
      rhs.layoutConstraints.maximumSize.width;
}

inline bool operator!=(
    TextMeasureCacheKey const &lhs,
    TextMeasureCacheKey const &rhs) {
  return !(lhs == rhs);
}

} // namespace react
} // namespace facebook

namespace std {

template <>
struct hash<facebook::react::TextMeasureCacheKey> {
  size_t operator()(facebook::react::TextMeasureCacheKey const &key) const {
    return folly::hash::hash_combine(
        0,
        textAttributedStringHashLayoutWise(key.attributedString),
        key.paragraphAttributes,
        key.layoutConstraints.maximumSize.width);
  }
};

} // namespace std

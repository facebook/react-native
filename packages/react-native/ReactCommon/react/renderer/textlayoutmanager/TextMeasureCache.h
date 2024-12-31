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
#include <react/utils/hash_combine.h>

namespace facebook::react {

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

  LineMeasurement(const folly::dynamic& data);

  bool operator==(const LineMeasurement& rhs) const;
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

// The Key type that is used for Line Measure Cache.
// The equivalence and hashing operations of this are defined to respect the
// nature of text measuring.
class LineMeasureCacheKey final {
 public:
  AttributedString attributedString{};
  ParagraphAttributes paragraphAttributes{};
  Size size{};
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

/*
 * Thread-safe, evicting hash table designed to store line measurement
 * information.
 */
using LineMeasureCache = SimpleThreadSafeCache<
    LineMeasureCacheKey,
    LinesMeasurements,
    kSimpleThreadSafeCacheSizeCap>;

inline bool areTextAttributesEquivalentLayoutWise(
    const TextAttributes& lhs,
    const TextAttributes& rhs) {
  // Here we check all attributes that affect layout metrics and don't check any
  // attributes that affect only a decorative aspect of displayed text (like
  // colors).
  return std::tie(
             lhs.fontFamily,
             lhs.fontWeight,
             lhs.fontStyle,
             lhs.fontVariant,
             lhs.allowFontScaling,
             lhs.dynamicTypeRamp,
             lhs.alignment) ==
      std::tie(
             rhs.fontFamily,
             rhs.fontWeight,
             rhs.fontStyle,
             rhs.fontVariant,
             rhs.allowFontScaling,
             rhs.dynamicTypeRamp,
             rhs.alignment) &&
      floatEquality(lhs.fontSize, rhs.fontSize) &&
      floatEquality(lhs.fontSizeMultiplier, rhs.fontSizeMultiplier) &&
      floatEquality(lhs.letterSpacing, rhs.letterSpacing) &&
      floatEquality(lhs.lineHeight, rhs.lineHeight);
}

inline size_t textAttributesHashLayoutWise(
    const TextAttributes& textAttributes) {
  // Taking into account the same props as
  // `areTextAttributesEquivalentLayoutWise` mentions.
  return facebook::react::hash_combine(
      textAttributes.fontFamily,
      textAttributes.fontSize,
      textAttributes.fontSizeMultiplier,
      textAttributes.fontWeight,
      textAttributes.fontStyle,
      textAttributes.fontVariant,
      textAttributes.allowFontScaling,
      textAttributes.dynamicTypeRamp,
      textAttributes.letterSpacing,
      textAttributes.lineHeight,
      textAttributes.alignment);
}

inline bool areAttributedStringFragmentsEquivalentLayoutWise(
    const AttributedString::Fragment& lhs,
    const AttributedString::Fragment& rhs) {
  return lhs.string == rhs.string &&
      areTextAttributesEquivalentLayoutWise(
             lhs.textAttributes, rhs.textAttributes) &&
      // LayoutMetrics of an attachment fragment affects the size of a measured
      // attributed string.
      (!lhs.isAttachment() ||
       (lhs.parentShadowView.layoutMetrics ==
        rhs.parentShadowView.layoutMetrics));
}

inline size_t attributedStringFragmentHashLayoutWise(
    const AttributedString::Fragment& fragment) {
  // Here we are not taking `isAttachment` and `layoutMetrics` into account
  // because they are logically interdependent and this can break an invariant
  // between hash and equivalence functions (and cause cache misses).
  return facebook::react::hash_combine(
      fragment.string, textAttributesHashLayoutWise(fragment.textAttributes));
}

inline bool areAttributedStringsEquivalentLayoutWise(
    const AttributedString& lhs,
    const AttributedString& rhs) {
  auto& lhsFragment = lhs.getFragments();
  auto& rhsFragment = rhs.getFragments();

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

inline size_t attributedStringHashLayoutWise(
    const AttributedString& attributedString) {
  auto seed = size_t{0};

  for (const auto& fragment : attributedString.getFragments()) {
    facebook::react::hash_combine(
        seed, attributedStringFragmentHashLayoutWise(fragment));
  }

  return seed;
}

inline bool operator==(
    const TextMeasureCacheKey& lhs,
    const TextMeasureCacheKey& rhs) {
  return areAttributedStringsEquivalentLayoutWise(
             lhs.attributedString, rhs.attributedString) &&
      lhs.paragraphAttributes == rhs.paragraphAttributes &&
      lhs.layoutConstraints.maximumSize.width ==
      rhs.layoutConstraints.maximumSize.width;
}

inline bool operator!=(
    const TextMeasureCacheKey& lhs,
    const TextMeasureCacheKey& rhs) {
  return !(lhs == rhs);
}

inline bool operator==(
    const LineMeasureCacheKey& lhs,
    const LineMeasureCacheKey& rhs) {
  return areAttributedStringsEquivalentLayoutWise(
             lhs.attributedString, rhs.attributedString) &&
      lhs.paragraphAttributes == rhs.paragraphAttributes &&
      lhs.size == rhs.size;
}

inline bool operator!=(
    const LineMeasureCacheKey& lhs,
    const LineMeasureCacheKey& rhs) {
  return !(lhs == rhs);
}

} // namespace facebook::react

namespace std {

template <>
struct hash<facebook::react::TextMeasureCacheKey> {
  size_t operator()(const facebook::react::TextMeasureCacheKey& key) const {
    return facebook::react::hash_combine(
        attributedStringHashLayoutWise(key.attributedString),
        key.paragraphAttributes,
        key.layoutConstraints.maximumSize.width);
  }
};

template <>
struct hash<facebook::react::LineMeasureCacheKey> {
  size_t operator()(const facebook::react::LineMeasureCacheKey& key) const {
    return facebook::react::hash_combine(
        attributedStringHashLayoutWise(key.attributedString),
        key.paragraphAttributes,
        key.size);
  }
};

} // namespace std

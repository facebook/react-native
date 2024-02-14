/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <cstdint>
#include <string_view>
#include <type_traits>

#include <react/renderer/css/CSSKeywords.h>
#include <react/renderer/css/CSSLengthUnit.h>
#include <react/utils/PackTraits.h>

namespace facebook::react {

/**
 * Represents a CSS component value type.
 * https://www.w3.org/TR/css-values-4/#component-types
 */
enum class CSSValueType : uint8_t {
  CSSWideKeyword,
  Keyword,
  Length,
  Number,
  Percentage,
  Ratio,
};

/**
 * Concrete representation for a CSS basic data type, or keywords
 * https://www.w3.org/TR/css-values-4/#component-types
 */
template <typename T>
concept CSSDataType = std::is_trivially_destructible_v<T> &&
    std::is_default_constructible_v<T> && requires() {
  sizeof(T);
};

#pragma pack(push, 1)
/**
 * Representation of CSS <length> data type
 * https://www.w3.org/TR/css-values-4/#lengths
 */
struct CSSLength {
  float value{};
  CSSLengthUnit unit{CSSLengthUnit::Px};
};
#pragma pack(pop)

/**
 * Representation of CSS <percentage> data type
 * https://www.w3.org/TR/css-values-4/#percentages
 */
struct CSSPercentage {
  float value{};
};

/**
 * Representation of CSS <number> data type
 * https://www.w3.org/TR/css-values-4/#numbers
 */
struct CSSNumber {
  float value{};
};

/**
 * Representation of CSS <ratio> data type
 * https://www.w3.org/TR/css-values-4/#ratios
 */
struct CSSRatio {
  float numerator{};
  float denominator{};
};

/**
 * CSSValueVariant represents a CSS component value:
 * https://www.w3.org/TR/css-values-4/#component-types
 *
 * A CSSValueVariant must be constrained to the set of possible CSS types it may
 * encounter. E.g. a dimension which accepts a CSS-wide keywords, "auto" or a
 * <length-percentage> would be modeled as
 * `CSSValueVariant<CSSAutoKeyord, CSSLength, CSSPercentage>`. This
 * allows for efficient storage, and customizing parsing based on the allowed
 * set of values.
 */
#pragma pack(push, 1)
template <CSSDataType... AllowedTypesT>
class CSSValueVariant {
  template <CSSValueType Type, CSSDataType ValueT>
  constexpr ValueT getIf() const {
    if (type_ == Type) {
      return *std::launder(reinterpret_cast<const ValueT*>(data_.data()));
    } else {
      return ValueT{};
    }
  }

  template <CSSDataType ValueT>
  static constexpr bool canRepresent() {
    return traits::containsType<ValueT, AllowedTypesT...>();
  }

  template <CSSDataType T, CSSDataType... Rest>
  static constexpr bool hasKeywordSet() {
    if constexpr (CSSKeywordSet<T> && !std::is_same_v<T, CSSWideKeyword>) {
      return true;
    } else if constexpr (sizeof...(Rest) == 0) {
      return false;
    } else {
      return hasKeywordSet<Rest...>();
    }
  }

  template <typename... T>
  struct PackedKeywordSet {
    using Type = void;
  };

  template <typename T, typename... RestT>
  struct PackedKeywordSet<T, RestT...> {
    using Type = std::conditional_t<
        hasKeywordSet<T>(),
        T,
        typename PackedKeywordSet<RestT...>::Type>;
  };

 public:
  using Keyword = typename PackedKeywordSet<AllowedTypesT...>::Type;

  constexpr CSSValueVariant() requires(canRepresent<CSSWideKeyword>())
      : CSSValueVariant(CSSValueType::CSSWideKeyword, CSSWideKeyword::Unset) {}

  static constexpr CSSValueVariant cssWideKeyword(CSSWideKeyword keyword) {
    return CSSValueVariant(
        CSSValueType::CSSWideKeyword, CSSWideKeyword{keyword});
  }

  template <CSSKeywordSet KeywordT>
  static constexpr CSSValueVariant keyword(KeywordT keyword) requires(
      canRepresent<KeywordT>()) {
    return CSSValueVariant(CSSValueType::Keyword, KeywordT{keyword});
  }

  static constexpr CSSValueVariant length(
      float value,
      CSSLengthUnit unit) requires(canRepresent<CSSLength>()) {
    return CSSValueVariant(CSSValueType::Length, CSSLength{value, unit});
  }

  static constexpr CSSValueVariant number(float value) requires(
      canRepresent<CSSNumber>()) {
    return CSSValueVariant(CSSValueType::Number, CSSNumber{value});
  }

  static constexpr CSSValueVariant percentage(float value) requires(
      canRepresent<CSSPercentage>()) {
    return CSSValueVariant(CSSValueType::Percentage, CSSPercentage{value});
  }

  static constexpr CSSValueVariant ratio(
      float numerator,
      float denominator) requires(canRepresent<CSSRatio>()) {
    return CSSValueVariant(
        CSSValueType::Ratio, CSSRatio{numerator, denominator});
  }

  constexpr CSSValueType type() const {
    return type_;
  }

  constexpr CSSWideKeyword getCSSWideKeyword() const
      requires(canRepresent<CSSWideKeyword>()) {
    return getIf<CSSValueType::CSSWideKeyword, CSSWideKeyword>();
  }

  constexpr Keyword getKeyword() const
      requires(hasKeywordSet<AllowedTypesT...>()) {
    return getIf<CSSValueType::Keyword, Keyword>();
  }

  constexpr CSSLength getLength() const requires(canRepresent<CSSLength>()) {
    return getIf<CSSValueType::Length, CSSLength>();
  }

  constexpr CSSNumber getNumber() const requires(canRepresent<CSSNumber>()) {
    return getIf<CSSValueType::Number, CSSNumber>();
  }

  constexpr CSSPercentage getPercentage() const
      requires(canRepresent<CSSPercentage>()) {
    return getIf<CSSValueType::Percentage, CSSPercentage>();
  }

  constexpr CSSRatio getRatio() const requires(canRepresent<CSSRatio>()) {
    return getIf<CSSValueType::Ratio, CSSRatio>();
  }

  constexpr operator bool() const requires(canRepresent<CSSWideKeyword>()) {
    return *this != CSSValueVariant{};
  }

  constexpr bool operator==(const CSSValueVariant& rhs) const = default;

 private:
  constexpr CSSValueVariant(CSSValueType type, CSSDataType auto&& value)
      : type_(type) {
    new (data_.data()) std::remove_cvref_t<decltype(value)>{
        std::forward<decltype(value)>(value)};
  }

  CSSValueType type_;
  std::array<std::byte, traits::maxSizeof<AllowedTypesT...>()> data_;
};
#pragma pack(pop)

static_assert(sizeof(CSSValueVariant<CSSKeyword>) == 2);
static_assert(sizeof(CSSValueVariant<CSSKeyword, CSSLength>) == 6);
static_assert(
    sizeof(CSSValueVariant<CSSKeyword, CSSLength, CSSPercentage>) == 6);
static_assert(sizeof(CSSValueVariant<CSSKeyword, CSSNumber>) == 5);
static_assert(sizeof(CSSValueVariant<CSSKeyword, CSSNumber, CSSRatio>) == 9);

} // namespace facebook::react

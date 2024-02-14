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
 * https://www.w3.org/TR/css-values-3/#component-types
 */
enum class CSSValueType : uint8_t {
  Keyword,
  Length,
  Number,
  Percentage,
};

/**
 * Concrete representation for a CSS basic data type.
 * https://www.w3.org/TR/css-values-3/#component-types
 */
template <typename T>
concept CSSBasicDataType = std::is_trivially_destructible_v<T> &&
    std::is_default_constructible_v<T> && requires() {
  sizeof(T);
};

#pragma pack(push, 1)
/**
 * Representation of CSS <length> data type
 * https://www.w3.org/TR/css-values-3/#lengths
 */
struct CSSLength {
  float value{};
  CSSLengthUnit unit{CSSLengthUnit::Px};
  constexpr bool operator==(const CSSLength& rhs) const = default;
};
#pragma pack(pop)

/**
 * Representation of CSS <percentage> data type
 * https://www.w3.org/TR/css-values-3/#percentages
 */
struct CSSPercentage {
  float value{};
  constexpr bool operator==(const CSSPercentage& rhs) const = default;
};

/**
 * Representation of CSS <number> data type
 * https://www.w3.org/TR/css-values-3/#numbers
 */
struct CSSNumber {
  float value{};
  constexpr bool operator==(const CSSNumber& rhs) const = default;
};

/**
 * CSSValueVariant represents a CSS component value:
 * https://www.w3.org/TR/css-values-3/#component-types
 *
 * A CSSValueVariant must be constrained to the set of possible CSS types it may
 * encounter. E.g. a dimension which accepts a CSS-wide keywords, "auto" or a
 * <length-percentage> would be modeled as
 * `CSSValueVariant<CSSAutoKeyord, CSSLength, CSSPercentage>`. This
 * allows for efficient storage, and customizing parsing based on the allowed
 * set of values.
 */
#pragma pack(push, 1)
template <typename KeywordT, CSSBasicDataType... Rest>
class CSSValueVariant {
  template <CSSValueType Type, CSSBasicDataType ValueT>
  constexpr ValueT getIf() const {
    if (type_ == Type) {
      return *std::launder(reinterpret_cast<const ValueT*>(data_.data()));
    } else {
      return ValueT{};
    }
  }

  template <CSSBasicDataType ValueT>
  static constexpr bool canRepresent() {
    return traits::containsType<ValueT, KeywordT, Rest...>();
  }

 public:
  constexpr CSSValueVariant()
      : CSSValueVariant(CSSValueType::Keyword, KeywordT::Unset) {}

  static constexpr CSSValueVariant keyword(KeywordT keyword) {
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

  constexpr CSSValueType type() const {
    return type_;
  }

  constexpr KeywordT getKeyword() const {
    return getIf<CSSValueType::Keyword, KeywordT>();
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

  constexpr operator bool() const {
    return *this != CSSValueVariant{};
  }

  constexpr bool operator==(const CSSValueVariant& rhs) const = default;

 private:
  constexpr CSSValueVariant(CSSValueType type, CSSBasicDataType auto&& value)
      : type_(type) {
    new (data_.data()) std::remove_cvref_t<decltype(value)>{
        std::forward<decltype(value)>(value)};
  }

  CSSValueType type_;
  std::array<std::byte, traits::maxSizeof<KeywordT, Rest...>()> data_;
};
#pragma pack(pop)

static_assert(sizeof(CSSValueVariant<CSSFlexDirection>) == 2);
static_assert(sizeof(CSSValueVariant<CSSAutoKeyword, CSSLength>) == 6);
static_assert(
    sizeof(CSSValueVariant<CSSAutoKeyword, CSSLength, CSSPercentage>) == 6);
static_assert(sizeof(CSSValueVariant<CSSKeyword, CSSNumber>) == 5);

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <bitset>
#include <memory>
#include <type_traits>
#include <vector>

#include <react/debug/react_native_assert.h>
#include <react/renderer/css/CSSParser.h>
#include <react/renderer/css/CSSProperties.h>

namespace facebook::react {

/**
 * CSSDeclaredStyle represents the set of style declarations on an element set
 * by the user. Users should generally not read from CSSDeclaredStyle directly,
 * and should instead use the computed style calculated on ShadowTree commit.
 */
class CSSDeclaredStyle {
 public:
  template <CSSProp Prop>
  void set(const CSSDeclaredValue<Prop>& value) {
    using DeclaredValueT = std::remove_cvref_t<CSSDeclaredValue<Prop>>;
    static_assert(sizeof(value) <= sizeof(PropMapping::value));
    static_assert(std::is_trivially_destructible_v<DeclaredValueT>);

    if (specifiedProperties_.test(to_underlying(Prop))) {
      auto it = std::lower_bound(
          properties_.begin(), properties_.end(), PropMapping{Prop, {}});
      react_native_assert(it->prop == Prop);
      std::construct_at(
          reinterpret_cast<DeclaredValueT*>(it->value.data()), value);
    } else {
      auto it = std::upper_bound(
          properties_.begin(), properties_.end(), PropMapping{Prop, {}});
      it = properties_.insert(it, {Prop, {}});
      std::construct_at(
          reinterpret_cast<DeclaredValueT*>(it->value.data()), value);
      specifiedProperties_.set(to_underlying(Prop));
    }
  }

  template <CSSProp Prop>
  void set(std::string_view value) {
    set<Prop>(parseCSSProp<Prop>(value));
  }

  /**
   * Returns the declared value, represented as the "unset" keyword if never
   * specified. Additional shorthands can be provided in order
   * of precedence if Prop is unset.
   */
  template <CSSProp Prop, CSSProp... ShorthandsT>
  CSSDeclaredValue<Prop> get() const {
    if (specifiedProperties_.test(to_underlying(Prop))) {
      auto it = std::lower_bound(
          properties_.begin(), properties_.end(), PropMapping{Prop, {}});
      react_native_assert(it->prop == Prop);

      CSSDeclaredValue<Prop> value{*std::launder(
          reinterpret_cast<const CSSDeclaredValue<Prop>*>(it->value.data()))};

      if (value) {
        return value;
      }
    }

    if constexpr (sizeof...(ShorthandsT) == 0) {
      return {};
    } else {
      return get<ShorthandsT...>();
    }
  }

  bool operator==(const CSSDeclaredStyle& rhs) const = default;

 private:
  struct PropMapping {
    CSSProp prop;
    std::array<
        std::byte,
        sizeof(CSSValueVariant<
               CSSWideKeyword,
               CSSKeyword,
               CSSLength,
               CSSNumber,
               CSSPercentage,
               CSSRatio>)>
        value;

    constexpr bool operator<(const PropMapping& rhs) const {
      return to_underlying(prop) < to_underlying(rhs.prop);
    }
  };

  std::vector<PropMapping> properties_;
  std::bitset<kCSSPropCount> specifiedProperties_;
};

} // namespace facebook::react

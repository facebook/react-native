/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <type_traits>
#include <variant>

#include <react/renderer/css/CSSCompoundDataType.h>
#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

template <CSSMaybeCompoundDataType T, CSSDelimiter Delim>
struct CSSList;

template <CSSDataType AllowedTypeT, CSSDelimiter Delim>
struct CSSList<AllowedTypeT, Delim> : public std::vector<AllowedTypeT> {};

template <CSSValidCompoundDataType AllowedTypesT, CSSDelimiter Delim>
struct CSSList<AllowedTypesT, Delim> : public std::vector<CSSVariantWithTypes<AllowedTypesT>> {};

template <CSSMaybeCompoundDataType AllowedTypeT, CSSDelimiter Delim>
struct CSSDataTypeParser<CSSList<AllowedTypeT, Delim>> {
  static inline auto consume(CSSSyntaxParser &parser) -> std::optional<CSSList<AllowedTypeT, Delim>>
  {
    CSSList<AllowedTypeT, Delim> result;
    for (auto nextValue = parseNextCSSValue<AllowedTypeT>(parser); !std::holds_alternative<std::monostate>(nextValue);
         nextValue = parseNextCSSValue<AllowedTypeT>(parser, Delim)) {
      // Copy from the variant of possible values to the element (either the
      // concrete type, or a variant of compound types which exlcudes the
      // possibility of std::monostate for parse error)
      std::visit(
          [&](auto &&v) {
            if constexpr (!std::is_same_v<std::remove_cvref_t<decltype(v)>, std::monostate>) {
              result.push_back(std::forward<decltype(v)>(v));
            }
          },
          nextValue);
    }

    if (result.empty()) {
      return {};
    }

    return result;
  }
};

/**
 * Represents a comma-separated repetition of a single type, or compound type
 * (represented as a variant of possible types).
 * https://www.w3.org/TR/css-values-4/#mult-comma
 */
template <CSSMaybeCompoundDataType AllowedTypeT>
using CSSCommaSeparatedList = CSSList<AllowedTypeT, CSSDelimiter::Comma>;

/**
 * Represents a whitespace-separated repetition of a single type, or compound
 * type (represented as a variant of possible types).
 * https://www.w3.org/TR/css-values-4/#component-combinators
 */
template <CSSMaybeCompoundDataType AllowedTypeT>
using CSSWhitespaceSeparatedList = CSSList<AllowedTypeT, CSSDelimiter::Whitespace>;

} // namespace facebook::react

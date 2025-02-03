/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <variant>

#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

template <CSSDataType AllowedTypeT, CSSDelimiter Delim>
struct CSSList : public std::vector<AllowedTypeT> {};

template <CSSDataType AllowedTypeT, CSSDelimiter Delim>
struct CSSDataTypeParser<CSSList<AllowedTypeT, Delim>> {
  static inline auto consume(CSSSyntaxParser& parser)
      -> std::optional<CSSList<AllowedTypeT, Delim>> {
    CSSList<AllowedTypeT, Delim> result;
    for (auto nextValue = parseNextCSSValue<AllowedTypeT>(parser);
         !std::holds_alternative<std::monostate>(nextValue);
         nextValue = parseNextCSSValue<AllowedTypeT>(parser, Delim)) {
      result.push_back(std::move(std::get<AllowedTypeT>(nextValue)));
    }

    if (result.empty()) {
      return {};
    }

    return result;
  }
};

/**
 * Represents a comma-separated repetition of a given single type.
 * https://www.w3.org/TR/css-values-4/#mult-comma
 */
template <CSSDataType AllowedTypeT>
using CSSCommaSeparatedList = CSSList<AllowedTypeT, CSSDelimiter::Comma>;

/**
 * Represents a whitespace-separated repetition of a given single type.
 * https://www.w3.org/TR/css-values-4/#component-combinators
 */
template <CSSDataType AllowedTypeT>
using CSSWhitespaceSeparatedList =
    CSSList<AllowedTypeT, CSSDelimiter::Whitespace>;

} // namespace facebook::react

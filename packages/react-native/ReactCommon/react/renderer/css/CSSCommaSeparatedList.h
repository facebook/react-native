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

/**
 * Represents a comma-separated repetition of a given single type.
 * https://www.w3.org/TR/css-values-4/#mult-comma
 */
template <CSSDataType AllowedTypeT>
struct CSSCommaSeparatedList : public std::vector<AllowedTypeT> {};

template <CSSDataType AllowedTypeT>
struct CSSDataTypeParser<CSSCommaSeparatedList<AllowedTypeT>> {
  static inline auto consume(CSSSyntaxParser& parser)
      -> std::optional<CSSCommaSeparatedList<AllowedTypeT>> {
    CSSCommaSeparatedList<AllowedTypeT> result;
    for (auto nextValue = parseNextCSSValue<AllowedTypeT>(parser);
         !std::holds_alternative<std::monostate>(nextValue);
         nextValue =
             parseNextCSSValue<AllowedTypeT>(parser, CSSDelimiter::Comma)) {
      result.push_back(std::move(std::get<AllowedTypeT>(nextValue)));
    }

    if (result.empty()) {
      return {};
    }

    return result;
  }
};

} // namespace facebook::react

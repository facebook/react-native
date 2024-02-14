/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <react/renderer/css/CSSKeywords.h>
#include <react/renderer/css/CSSLengthUnit.h>
#include <react/renderer/css/CSSTokenizer.h>
#include <react/renderer/css/CSSValue.h>
#include <react/utils/PackTraits.h>

namespace facebook::react {

namespace detail {
template <CSSKeywordSet KeywordT, CSSBasicDataType... Rest>
CSSValueVariant<KeywordT, Rest...> consumeComponentValue(
    const CSSToken& token) {
  using CSSValueT = CSSValueVariant<KeywordT, Rest...>;
  switch (token.type()) {
    case CSSTokenType::Ident:
      if (auto keyword = parseCSSKeyword<KeywordT>(token.stringValue())) {
        return CSSValueT::keyword(*keyword);
      }
      break;
    case CSSTokenType::Dimension:
      if constexpr (traits::containsType<CSSLength, Rest...>()) {
        if (auto unit = parseCSSLengthUnit(token.unit())) {
          return CSSValueT::length(token.numericValue(), *unit);
        }
      }
      break;
    case CSSTokenType::Percentage:
      if constexpr (traits::containsType<CSSPercentage, Rest...>()) {
        return CSSValueT::percentage(token.numericValue());
      }
      break;
    case CSSTokenType::Number:
      // For zero lengths the unit identifier is optional (i.e. can be
      // syntactically represented as the <number> 0). However, if a 0 could
      // be parsed as either a <number> or a <length> in a property (such as
      // line-height), it must parse as a <number>.
      // https://www.w3.org/TR/css-values-4/#lengths
      if constexpr (traits::containsType<CSSNumber, Rest...>()) {
        return CSSValueT::number(token.numericValue());
      } else if constexpr (traits::containsType<CSSLength, Rest...>()) {
        if (token.numericValue() == 0) {
          return CSSValueT::length(0, CSSLengthUnit::Px);
        }
      }
      break;
    default:
      break;
  }
  return CSSValueT{};
}
} // namespace detail

/*
 * Parse a single CSS component value as a keyword constrained to those
 * allowable by KeywordRepresentationT.
 * https://www.w3.org/TR/css-syntax-3/#parse-component-value
 */
template <CSSKeywordSet KeywordT, CSSBasicDataType... Rest>
CSSValueVariant<KeywordT, Rest...> parseCSSValue(std::string_view css) {
  CSSTokenizer tokenizer(css);

  auto token = tokenizer.next();
  while (token.type() == CSSTokenType::WhiteSpace) {
    token = tokenizer.next();
  }

  auto value = detail::consumeComponentValue<KeywordT, Rest...>(token);

  token = tokenizer.next();
  while (token.type() == CSSTokenType::WhiteSpace) {
    token = tokenizer.next();
  }
  if (token.type() == CSSTokenType::EndOfFile) {
    return value;
  }

  return {};
}

} // namespace facebook::react

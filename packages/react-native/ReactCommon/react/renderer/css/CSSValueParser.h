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

#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSKeyword.h>
#include <react/renderer/css/CSSSyntaxParser.h>

namespace facebook::react {

namespace detail {

class CSSValueParser {
 public:
  explicit constexpr CSSValueParser(CSSSyntaxParser& parser)
      : parser_{parser} {}

  /*
   * Attempts to parse the characters starting at the current component value
   * into one of the given data types. Types are attempted in order, which the
   * caller must consider (e.g. a number token should be preferred to be a
   * <number> before <length>).
   */
  template <CSSDataType... AllowedTypesT>
  constexpr std::variant<std::monostate, AllowedTypesT...> consumeValue(
      CSSComponentValueDelimiter delimeter = CSSComponentValueDelimiter::None) {
    using ReturnT = std::variant<std::monostate, AllowedTypesT...>;

    return parser_.consumeComponentValue<ReturnT>(
        delimeter,
        [&](const CSSPreservedToken& token) {
          return tryConsumePreservedToken<
              ReturnT,
              CSSDataTypeParser<AllowedTypesT>...>(token);
        },
        [&](const CSSSimpleBlock& block, CSSSyntaxParser& blockParser) {
          return tryConsumeSimpleBlock<
              ReturnT,
              CSSDataTypeParser<AllowedTypesT>...>(block, blockParser);
        },
        [&](const CSSFunctionBlock& func, CSSSyntaxParser& blockParser) {
          return tryConsumeFunctionBlock<
              ReturnT,
              CSSDataTypeParser<AllowedTypesT>...>(func, blockParser);
        });
  }

  constexpr bool isFinished() const {
    return parser_.isFinished();
  }

  constexpr void consumeWhitespace() {
    parser_.consumeWhitespace();
  }

 private:
  template <typename ReturnT>
  constexpr ReturnT tryConsumePreservedToken(
      const CSSPreservedToken& /*token*/) {
    return {};
  }

  template <
      typename ReturnT,
      CSSValidDataTypeParser ParserT,
      CSSValidDataTypeParser... RestParserT>
  constexpr ReturnT tryConsumePreservedToken(const CSSPreservedToken& token) {
    if constexpr (CSSPreservedTokenSink<ParserT>) {
      if (auto ret = ParserT::consumePreservedToken(token, parser_)) {
        return *ret;
      }
    }

    if constexpr (CSSSimplePreservedTokenSink<ParserT>) {
      if (auto ret = ParserT::consumePreservedToken(token)) {
        return *ret;
      }
    }

    return tryConsumePreservedToken<ReturnT, RestParserT...>(token);
  }

  template <typename ReturnT>
  constexpr ReturnT tryConsumeSimpleBlock(
      const CSSSimpleBlock& /*token*/,
      CSSSyntaxParser& /*blockParser*/) {
    return {};
  }

  template <
      typename ReturnT,
      CSSValidDataTypeParser ParserT,
      CSSValidDataTypeParser... RestParserT>
  constexpr ReturnT tryConsumeSimpleBlock(
      const CSSSimpleBlock& block,
      CSSSyntaxParser& blockParser) {
    if constexpr (CSSSimpleBlockSink<ParserT>) {
      if (auto ret = ParserT::consumeSimpleBlock(block, blockParser)) {
        return *ret;
      }
    }

    return tryConsumeSimpleBlock<ReturnT, RestParserT...>(block, blockParser);
  }

  template <typename ReturnT>
  constexpr ReturnT tryConsumeFunctionBlock(
      const CSSFunctionBlock& /*func*/,
      CSSSyntaxParser& /*blockParser*/) {
    return {};
  }

  template <
      typename ReturnT,
      CSSValidDataTypeParser ParserT,
      CSSValidDataTypeParser... RestParserT>
  constexpr ReturnT tryConsumeFunctionBlock(
      const CSSFunctionBlock& func,
      CSSSyntaxParser& blockParser) {
    if constexpr (CSSFunctionBlockSink<ParserT>) {
      if (auto ret = ParserT::consumeFunctionBlock(func, blockParser)) {
        return *ret;
      }
    }

    return tryConsumeFunctionBlock<ReturnT, RestParserT...>(func, blockParser);
  }

  CSSSyntaxParser& parser_;
};

} // namespace detail

/**
 * Parse a single CSS property value. Returns a variant holding std::monostate
 * on syntax error.
 */
template <CSSDataType... AllowedTypesT>
constexpr auto parseCSSProperty(std::string_view css)
    -> std::variant<std::monostate, CSSWideKeyword, AllowedTypesT...> {
  CSSSyntaxParser syntaxParser(css);
  detail::CSSValueParser parser(syntaxParser);

  parser.consumeWhitespace();
  auto value = parser.consumeValue<CSSWideKeyword, AllowedTypesT...>();
  parser.consumeWhitespace();

  if (parser.isFinished()) {
    return value;
  }

  return {};
};

/**
 * Attempts to parse the next CSS value of a given set of data types, at the
 * current location of the syntax parser, advancing the syntax parser if
 * successful.
 */
template <CSSDataType... AllowedTypesT>
constexpr auto parseNextCSSValue(
    CSSSyntaxParser& syntaxParser,
    CSSComponentValueDelimiter delimeter = CSSComponentValueDelimiter::None)
    -> std::variant<std::monostate, AllowedTypesT...> {
  detail::CSSValueParser valueParser(syntaxParser);
  return valueParser.consumeValue<AllowedTypesT...>(delimeter);
}

} // namespace facebook::react

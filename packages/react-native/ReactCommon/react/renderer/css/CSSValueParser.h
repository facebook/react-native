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
      CSSDelimiter delimeter,
      CSSCompoundDataType<AllowedTypesT...>) {
    using ReturnT = std::variant<std::monostate, AllowedTypesT...>;

    auto consumedValue =
        tryConsumeParser<ReturnT, CSSDataTypeParser<AllowedTypesT>...>(
            delimeter);

    if (!std::holds_alternative<std::monostate>(consumedValue)) {
      return consumedValue;
    }

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
      auto currentParser = blockParser;
      if (auto ret = ParserT::consumeSimpleBlock(block, blockParser)) {
        return *ret;
      }
      blockParser = currentParser;
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
      auto currentParser = blockParser;
      if (auto ret = ParserT::consumeFunctionBlock(func, blockParser)) {
        return *ret;
      }
      blockParser = currentParser;
    }

    return tryConsumeFunctionBlock<ReturnT, RestParserT...>(func, blockParser);
  }

  template <typename ReturnT>
  constexpr ReturnT tryConsumeParser(CSSDelimiter /*delimeter*/) {
    return {};
  }

  template <
      typename ReturnT,
      CSSValidDataTypeParser ParserT,
      CSSValidDataTypeParser... RestParserT>
  constexpr ReturnT tryConsumeParser(CSSDelimiter delimeter) {
    if constexpr (CSSParserSink<ParserT>) {
      auto originalParser = parser_;
      if (parser_.consumeDelimiter(delimeter)) {
        if (auto ret = ParserT::consume(parser_)) {
          return *ret;
        }
      }
      parser_ = originalParser;
    }

    return tryConsumeParser<ReturnT, RestParserT...>(delimeter);
  }

  CSSSyntaxParser& parser_;
};

} // namespace detail

/**
 * Parse a single CSS property value. Returns a variant holding std::monostate
 * on syntax error.
 */
template <CSSMaybeCompoundDataType... AllowedTypesT>
constexpr auto parseCSSProperty(std::string_view css)
    -> CSSVariantWithTypes<
        CSSMergedDataTypes<CSSWideKeyword, AllowedTypesT...>,
        std::monostate> {
  CSSSyntaxParser syntaxParser(css);
  detail::CSSValueParser parser(syntaxParser);

  parser.consumeWhitespace();
  auto value = parser.consumeValue(
      CSSDelimiter::None,
      CSSMergedDataTypes<CSSWideKeyword, AllowedTypesT...>{});
  parser.consumeWhitespace();

  if (parser.isFinished()) {
    return value;
  }

  return {};
};

/**
 * Attempts to parse the next CSS value of a given set of data types, at the
 * current location of the syntax parser, advancing the syntax parser
 */
template <CSSMaybeCompoundDataType... AllowedTypesT>
constexpr auto parseNextCSSValue(
    CSSSyntaxParser& syntaxParser,
    CSSDelimiter delimeter = CSSDelimiter::None)
    -> CSSVariantWithTypes<
        CSSMergedDataTypes<AllowedTypesT...>,
        std::monostate> {
  detail::CSSValueParser valueParser(syntaxParser);
  return valueParser.consumeValue(
      delimeter, CSSMergedDataTypes<AllowedTypesT...>{});
}

/**
 * Attempts to parse the next CSS value of a given set of data types, at the
 * current location of the syntax parser, without advancing the syntax parser
 */
template <CSSMaybeCompoundDataType... AllowedTypesT>
constexpr auto peekNextCSSValue(
    CSSSyntaxParser& syntaxParser,
    CSSDelimiter delimeter = CSSDelimiter::None)
    -> CSSVariantWithTypes<
        CSSMergedDataTypes<AllowedTypesT...>,
        std::monostate> {
  auto savedParser = syntaxParser;
  detail::CSSValueParser valueParser(syntaxParser);
  auto ret = valueParser.consumeValue(
      delimeter, CSSMergedDataTypes<AllowedTypesT...>{});
  syntaxParser = savedParser;
  return ret;
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <concepts>
#include <optional>

#include <react/renderer/css/CSSTokenizer.h>

namespace facebook::react {

class CSSSyntaxParser;

/**
 * Describes context for a CSS function component value.
 */
struct CSSFunctionBlock {
  std::string_view name{};
};

/**
 * Describes a preserved token component value.
 */
using CSSPreservedToken = CSSToken;

/**
 * Describes context for a CSS function component value.
 */
struct CSSSimpleBlock {
  CSSTokenType openBracketType{};
};

/**
 * A CSSFunctionVisitor is called to start parsing a function component value.
 * At this point, the Parser is positioned at the start of the function
 * component value list. It is expected that the visitor finishes before the end
 * of the function block.
 */
template <typename T, typename ReturnT>
concept CSSFunctionVisitor =
    requires(T visitor, CSSFunctionBlock func, CSSSyntaxParser& blockParser) {
      { visitor(func, blockParser) } -> std::convertible_to<ReturnT>;
    };

/**
 * A CSSPreservedTokenVisitor is called after parsing a preserved token
 * component value.
 */
template <typename T, typename ReturnT>
concept CSSPreservedTokenVisitor =
    requires(T visitor, CSSPreservedToken token) {
      { visitor(token) } -> std::convertible_to<ReturnT>;
    };

/**
 * A CSSSimpleBlockVisitor is called after parsing a simple block component
 * value. It is expected that the visitor finishes before the end
 * of the block.
 */
template <typename T, typename ReturnT>
concept CSSSimpleBlockVisitor =
    requires(T visitor, CSSSimpleBlock block, CSSSyntaxParser& blockParser) {
      { visitor(block, blockParser) } -> std::convertible_to<ReturnT>;
    };

/**
 * Any visitor for a component value.
 */
template <typename T, typename ReturnT>
concept CSSComponentValueVisitor = CSSFunctionVisitor<T, ReturnT> ||
    CSSPreservedTokenVisitor<T, ReturnT> || CSSSimpleBlockVisitor<T, ReturnT>;

/**
 * Represents a variadic set of CSSComponentValueVisitor with no more than one
 * of a specific type of visitor.
 */
template <typename ReturnT, typename... VisitorsT>
concept CSSUniqueComponentValueVisitors =
    (CSSComponentValueVisitor<VisitorsT, ReturnT> && ... && true) &&
    ((CSSFunctionVisitor<VisitorsT, ReturnT> ? 1 : 0) + ... + 0) <= 1 &&
    ((CSSPreservedTokenVisitor<VisitorsT, ReturnT> ? 1 : 0) + ... + 0) <= 1 &&
    ((CSSSimpleBlockVisitor<VisitorsT, ReturnT> ? 1 : 0) + ... + 0) <= 1;

/**
 * Describes the delimeter to expect before the next component value.
 */
enum class CSSComponentValueDelimiter {
  Comma,
  Whitespace,
  CommaOrWhitespace,
  None,
};

/**
 * CSSSyntaxParser allows parsing streams of CSS text into "component
 * values".
 *
 * https://www.w3.org/TR/css-syntax-3/#component-value
 */
class CSSSyntaxParser {
  template <typename ReturnT, CSSComponentValueVisitor<ReturnT>... VisitorsT>
  friend struct CSSComponentValueVisitorDispatcher;

 public:
  /**
   * Construct the parser over the given string_view, which must stay alive for
   * the duration of the CSSSyntaxParser.
   */
  explicit constexpr CSSSyntaxParser(std::string_view css)
      : tokenizer_{css}, currentToken_(tokenizer_.next()) {}

  constexpr CSSSyntaxParser(const CSSSyntaxParser&) = default;
  constexpr CSSSyntaxParser(CSSSyntaxParser&&) = default;

  constexpr CSSSyntaxParser& operator=(const CSSSyntaxParser&) = default;
  constexpr CSSSyntaxParser& operator=(CSSSyntaxParser&&) = default;

  /**
   * Directly consume the next component value. The component value is provided
   * to a passed in "visitor", typically a lambda which accepts the component
   * value in a new scope. The visitor may read this component parameter into a
   * higher-level data structure, and continue parsing within its scope using
   * the same underlying CSSSyntaxParser.
   *
   * https://www.w3.org/TR/css-syntax-3/#consume-component-value
   *
   * @param <ReturnT> caller-specified return type of visitors. This type will
   * be set to its default constructed state if consuming a component value with
   * no matching visitors, or syntax error
   * @param visitors A unique list of CSSComponentValueVisitor to be called on a
   * match
   * @param delimiter The expected delimeter to occur before the next component
   * value
   * @returns the visitor returned value, or a default constructed value if no
   * visitor was matched, or a syntax error occurred.
   */
  template <typename ReturnT = std::nullptr_t>
  constexpr ReturnT consumeComponentValue(
      CSSComponentValueDelimiter delimiter,
      const CSSComponentValueVisitor<ReturnT> auto&... visitors)
    requires(CSSUniqueComponentValueVisitors<ReturnT, decltype(visitors)...>);

  template <typename ReturnT = std::nullptr_t>
  constexpr ReturnT consumeComponentValue(
      const CSSComponentValueVisitor<ReturnT> auto&... visitors)
    requires(CSSUniqueComponentValueVisitors<ReturnT, decltype(visitors)...>);

  /**
   * Peek at the next component value without consuming it. The component value
   * is provided to a passed in "visitor", typically a lambda which accepts the
   * component value in a new scope. The visitor may read this component
   * parameter into a higher-level data structure, and continue parsing within
   * its scope using the same underlying CSSSyntaxParser.
   *
   * https://www.w3.org/TR/css-syntax-3/#consume-component-value
   *
   * @param <ReturnT> caller-specified return type of visitors. This type will
   * be set to its default constructed state if consuming a component value with
   * no matching visitors, or syntax error
   * @param visitors A unique list of CSSComponentValueVisitor to be called on a
   * match
   * @param delimiter The expected delimeter to occur before the next component
   * value
   * @returns the visitor returned value, or a default constructed value if no
   * visitor was matched, or a syntax error occurred.
   */
  template <typename ReturnT = std::nullptr_t>
  constexpr ReturnT peekComponentValue(
      CSSComponentValueDelimiter delimiter,
      const CSSComponentValueVisitor<ReturnT> auto&... visitors)
    requires(CSSUniqueComponentValueVisitors<ReturnT, decltype(visitors)...>);

  template <typename ReturnT = std::nullptr_t>
  constexpr ReturnT peekComponentValue(
      const CSSComponentValueVisitor<ReturnT> auto&... visitors)
    requires(CSSUniqueComponentValueVisitors<ReturnT, decltype(visitors)...>);

  /**
   * The parser is considered finished when there are no more remaining tokens
   * to be processed
   */
  constexpr bool isFinished() const {
    return currentToken_.type() == CSSTokenType::EndOfFile;
  }

  /**
   * Consume any whitespace tokens.
   */
  constexpr void consumeWhitespace() {
    if (currentToken_.type() == CSSTokenType::WhiteSpace) {
      currentToken_ = tokenizer_.next();
    }
  }

 private:
  CSSSyntaxParser(CSSSyntaxParser& parser, CSSTokenType terminator)
      : tokenizer_{parser.tokenizer_},
        currentToken_{parser.currentToken_},
        terminator_{terminator} {}

  constexpr const CSSToken& peek() const {
    return currentToken_;
  }

  constexpr CSSToken consumeToken() {
    auto prevToken = currentToken_;
    currentToken_ = tokenizer_.next();
    return prevToken;
  }

  constexpr void advanceToBlockParser(CSSSyntaxParser& blockParser) {
    currentToken_ = blockParser.currentToken_;
    tokenizer_ = blockParser.tokenizer_;
  }

  CSSTokenizer tokenizer_;
  CSSToken currentToken_;
  CSSTokenType terminator_{CSSTokenType::EndOfFile};
};

template <typename ReturnT, CSSComponentValueVisitor<ReturnT>... VisitorsT>
struct CSSComponentValueVisitorDispatcher {
  CSSSyntaxParser& parser;

  constexpr ReturnT consumeComponentValue(
      CSSComponentValueDelimiter delimiter,
      const VisitorsT&... visitors) {
    switch (delimiter) {
      case CSSComponentValueDelimiter::Comma:
        parser.consumeWhitespace();
        if (parser.peek().type() != CSSTokenType::Comma) {
          return ReturnT{};
        }
        parser.consumeToken();
        parser.consumeWhitespace();
        break;
      case CSSComponentValueDelimiter::Whitespace:
        parser.consumeWhitespace();
        break;
      case CSSComponentValueDelimiter::CommaOrWhitespace:
        parser.consumeWhitespace();
        if (parser.peek().type() == CSSTokenType::Comma) {
          parser.consumeToken();
        }
        parser.consumeWhitespace();
        break;
      case CSSComponentValueDelimiter::None:
        break;
    }

    if (parser.peek().type() == parser.terminator_) {
      return {};
    }

    switch (parser.peek().type()) {
      case CSSTokenType::Function:
        if (auto ret = visitFunction(visitors...)) {
          return *ret;
        }
        break;
      case CSSTokenType::OpenParen:
        if (auto ret =
                visitSimpleBlock(CSSTokenType::CloseParen, visitors...)) {
          return *ret;
        }
        break;
      case CSSTokenType::OpenSquare:
        if (auto ret =
                visitSimpleBlock(CSSTokenType::CloseSquare, visitors...)) {
          return *ret;
        }
        break;
      case CSSTokenType::OpenCurly:
        if (auto ret =
                visitSimpleBlock(CSSTokenType::CloseCurly, visitors...)) {
          return *ret;
        }
        break;
      default:
        if (auto ret = visitPreservedToken(visitors...)) {
          return *ret;
        }
        break;
    }

    return ReturnT{};
  }

  constexpr ReturnT peekComponentValue(
      CSSComponentValueDelimiter delimiter,
      const VisitorsT&... visitors) {
    auto originalParser = parser;
    auto ret = consumeComponentValue(delimiter, visitors...);
    parser = originalParser;
    return ret;
  }

  constexpr std::optional<ReturnT> visitFunction(
      const CSSComponentValueVisitor<ReturnT> auto& visitor,
      const CSSComponentValueVisitor<ReturnT> auto&... rest) {
    if constexpr (CSSFunctionVisitor<decltype(visitor), ReturnT>) {
      auto name = parser.consumeToken().stringValue();

      // CSS syntax spec says whitespace is a preserved token, but CSS values
      // spec allows whitespace around parens for all function notation, so we
      // allow this to let the visitors not need to deal with leading/trailing
      // whitespace. https://www.w3.org/TR/css-values-3/#functional-notations
      parser.consumeWhitespace();

      auto blockParser =
          CSSSyntaxParser{parser, CSSTokenType::CloseParen /*terminator*/};
      auto functionValue = visitor({name}, blockParser);
      parser.advanceToBlockParser(blockParser);
      parser.consumeWhitespace();
      if (parser.peek().type() == CSSTokenType::CloseParen) {
        parser.consumeToken();
        return functionValue;
      }

      return {};
    }

    return visitFunction(rest...);
  }

  constexpr std::optional<ReturnT> visitFunction() {
    while (parser.peek().type() != CSSTokenType::CloseParen) {
      parser.consumeToken();
    }
    parser.consumeToken();

    return {};
  }

  constexpr std::optional<ReturnT> visitSimpleBlock(
      CSSTokenType endToken,
      const CSSComponentValueVisitor<ReturnT> auto& visitor,
      const CSSComponentValueVisitor<ReturnT> auto&... rest) {
    if constexpr (CSSSimpleBlockVisitor<decltype(visitor), ReturnT>) {
      auto openBracketType = parser.consumeToken().type();
      parser.consumeWhitespace();
      auto blockParser = CSSSyntaxParser{parser, endToken};
      auto blockValue = visitor({openBracketType}, blockParser);
      parser.advanceToBlockParser(blockParser);
      parser.consumeWhitespace();
      if (parser.peek().type() == endToken) {
        parser.consumeToken();
        return blockValue;
      }

      return {};
    }
    return visitSimpleBlock(endToken, rest...);
  }

  constexpr std::optional<ReturnT> visitSimpleBlock(CSSTokenType endToken) {
    while (parser.peek().type() != endToken) {
      parser.consumeToken();
    }
    parser.consumeToken();
    return {};
  }

  constexpr std::optional<ReturnT> visitPreservedToken(
      const CSSComponentValueVisitor<ReturnT> auto& visitor,
      const CSSComponentValueVisitor<ReturnT> auto&... rest) {
    if constexpr (CSSPreservedTokenVisitor<decltype(visitor), ReturnT>) {
      return visitor(parser.consumeToken());
    }
    return visitPreservedToken(rest...);
  }

  constexpr std::optional<ReturnT> visitPreservedToken() {
    parser.consumeToken();
    return {};
  }
};

template <typename ReturnT>
constexpr ReturnT CSSSyntaxParser::consumeComponentValue(
    CSSComponentValueDelimiter delimiter,
    const CSSComponentValueVisitor<ReturnT> auto&... visitors)
  requires(CSSUniqueComponentValueVisitors<ReturnT, decltype(visitors)...>)
{
  return CSSComponentValueVisitorDispatcher<ReturnT, decltype(visitors)...>{
      *this}
      .consumeComponentValue(delimiter, visitors...);
}

template <typename ReturnT>
constexpr ReturnT CSSSyntaxParser::consumeComponentValue(
    const CSSComponentValueVisitor<ReturnT> auto&... visitors)
  requires(CSSUniqueComponentValueVisitors<ReturnT, decltype(visitors)...>)
{
  return consumeComponentValue<ReturnT>(
      CSSComponentValueDelimiter::None, visitors...);
}

template <typename ReturnT>
constexpr ReturnT CSSSyntaxParser::peekComponentValue(
    CSSComponentValueDelimiter delimiter,
    const CSSComponentValueVisitor<ReturnT> auto&... visitors)
  requires(CSSUniqueComponentValueVisitors<ReturnT, decltype(visitors)...>)
{
  return CSSComponentValueVisitorDispatcher<ReturnT, decltype(visitors)...>{
      *this}
      .peekComponentValue(delimiter, visitors...);
}

template <typename ReturnT>
constexpr ReturnT CSSSyntaxParser::peekComponentValue(
    const CSSComponentValueVisitor<ReturnT> auto&... visitors)
  requires(CSSUniqueComponentValueVisitors<ReturnT, decltype(visitors)...>)
{
  return peekComponentValue<ReturnT>(
      CSSComponentValueDelimiter::None, visitors...);
}

} // namespace facebook::react

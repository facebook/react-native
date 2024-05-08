/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <variant>
#include <vector>

#include <react/renderer/css/CSSTokenizer.h>

namespace facebook::react {

/**
 * CSSParser allows parsing streams of text into results corresponding to the
 * CSS grammar.
 */
class CSSParser {
 public:
  struct FunctionComponentValue;

  /**
   * "A component value is one of the preserved tokens, a function, or a simple
   * block."
   * https://www.w3.org/TR/css-syntax-3/#component-value
   *
   * The Fabric CSS parser currently does not need to handle simple blocks.
   */
  using ComponentValue =
      std::variant<std::monostate, CSSToken, FunctionComponentValue>;

  struct FunctionComponentValue {
    std::string_view name{};
    std::vector<ComponentValue> args{};
  };
  /**
   * Construct the parser over the given string_view, which must stay alive for
   * the duration of the CSSParser.
   */
  explicit constexpr CSSParser(std::string_view css)
      : tokenizer_{css}, currentToken_(tokenizer_.next()) {}

  /**
   * Parse and return a single component value
   *
   * https://www.w3.org/TR/css-syntax-3/#parse-component-value
   */
  inline ComponentValue parseComponentValue() {
    consumeWhitespace();
    if (peek().type() == CSSTokenType::EndOfFile) {
      return {};
    }

    auto componentValue = consumeComponentValue();
    consumeWhitespace();

    if (peek().type() == CSSTokenType::EndOfFile) {
      return componentValue;
    }

    return {};
  }

  /**
   * Directly consume the next component value
   *
   * https://www.w3.org/TR/css-syntax-3/#consume-component-value
   */
  inline ComponentValue consumeComponentValue() {
    if (peek().type() == CSSTokenType::Function) {
      return consumeFunction();
    } else {
      return consumeToken();
    }
  }

 private:
  constexpr void consumeWhitespace() {
    while (peek().type() == CSSTokenType::WhiteSpace) {
      consumeToken();
    }
  }

  constexpr const CSSToken& peek() const {
    return currentToken_;
  }

  constexpr CSSToken consumeToken() {
    auto prevToken = currentToken_;
    currentToken_ = tokenizer_.next();
    return prevToken;
  }

  inline ComponentValue consumeFunction() {
    // https://www.w3.org/TR/css-syntax-3/#consume-a-function
    FunctionComponentValue function{.name = consumeToken().stringValue()};

    while (true) {
      auto nextValue = consumeComponentValue();
      if (std::holds_alternative<std::monostate>(nextValue)) {
        return {};
      }

      if (auto token = std::get_if<CSSToken>(&nextValue)) {
        if (token->type() == CSSTokenType::CloseParen) {
          return function;
        }
        if (token->type() == CSSTokenType::EndOfFile) {
          return {};
        }
        function.args.emplace_back(std::move(*token));
        continue;
      }

      if (auto func = std::get_if<FunctionComponentValue>(&nextValue)) {
        function.args.emplace_back(std::move(*func));
        continue;
      }

      return {};
    }

    return function;
  }

  CSSTokenizer tokenizer_;
  CSSToken currentToken_;
};

} // namespace facebook::react

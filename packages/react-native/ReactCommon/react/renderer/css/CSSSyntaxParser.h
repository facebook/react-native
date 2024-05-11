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
 * CSSSyntaxParser allows parsing streams of CSS text into "component values",
 * being either a preserved token, or a function.
 *
 * https://www.w3.org/TR/css-syntax-3/#component-value
 */
class CSSSyntaxParser {
 public:
  struct Function;

  using PreservedToken = CSSToken;
  using ComponentValue = std::variant<std::monostate, PreservedToken, Function>;

  struct Function {
    std::string_view name{};
    std::vector<ComponentValue> args{};
  };

  /**
   * Construct the parser over the given string_view, which must stay alive for
   * the duration of the CSSSyntaxParser.
   */
  explicit constexpr CSSSyntaxParser(std::string_view css)
      : tokenizer_{css}, currentToken_(tokenizer_.next()) {}

  /**
   * Directly consume the next component value
   *
   * https://www.w3.org/TR/css-syntax-3/#consume-component-value
   */
  inline ComponentValue consumeComponentValue() {
    if (peek().type() == CSSTokenType::Function) {
      auto function = consumeFunction();
      return function.has_value() ? ComponentValue{std::move(*function)}
                                  : ComponentValue{};
    } else {
      return consumeToken();
    }
  }

 private:
  constexpr const CSSToken& peek() const {
    return currentToken_;
  }

  constexpr CSSToken consumeToken() {
    auto prevToken = currentToken_;
    currentToken_ = tokenizer_.next();
    return prevToken;
  }

  inline std::optional<Function> consumeFunction() {
    // https://www.w3.org/TR/css-syntax-3/#consume-a-function
    Function function{.name = consumeToken().stringValue()};

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

      if (auto func = std::get_if<Function>(&nextValue)) {
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

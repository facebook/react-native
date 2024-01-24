/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>
#include <string_view>
#include <utility>

namespace facebook::react {

/**
 * One of the tokens defined as part of
 * https://www.w3.org/TR/css-syntax-3/#tokenizer-definitions
 */
enum class CSSTokenType {
  Delim,
  Dimension,
  EndOfFile,
  Ident,
  Number,
  Percent,
  WhiteSpace,
};

struct CSSToken {
  CSSToken(CSSTokenType type) : type_(type) {}
  CSSToken(CSSTokenType type, std::string_view value)
      : type_{type}, stringValue_{value} {}
  CSSToken(CSSTokenType type, float value)
      : type_{type}, numericValue_{value} {}
  CSSToken(CSSTokenType type, float value, std::string_view unit)
      : type_{type}, numericValue_{value}, unit_{unit} {}

  CSSTokenType type() const {
    return type_;
  }

  std::string_view stringValue() const {
    return stringValue_;
  }

  float numericValue() const {
    return numericValue_;
  }

  std::string_view unit() const {
    return unit_;
  }

  bool operator==(const CSSToken& other) const = default;

 private:
  CSSTokenType type_;
  std::string_view stringValue_;
  float numericValue_{0.0f};
  std::string_view unit_;
};

/**
 * A minimal tokenizer for a subset of CSS "component values" (e.g. `10px`,
 * `auto`).
 *
 * This is based on the W3C CSS Syntax specification, with simplifications made
 * for syntax which React Native does not attempt to support.
 * https://www.w3.org/TR/css-syntax-3/#tokenizing-and-parsing
 */
class CSSTokenizer {
 public:
  CSSTokenizer(std::string_view tokenStream);
  CSSToken next();

 private:
  char peek() const;
  char peekNext() const;
  void advance();

  CSSToken consumeDelim();
  CSSToken consumeWhitespace();
  CSSToken consumeNumber();
  CSSToken consumeNumeric();
  CSSToken consumeIdent();

  std::string_view consumeRunningValue();

  static bool isDigit(char c);
  static bool isIdentStart(char c);
  static bool isIdent(char c);
  static bool isWhitespace(char c);

  std::string_view remainingTokenStream_;
  size_t position_{0};
};
} // namespace facebook::react

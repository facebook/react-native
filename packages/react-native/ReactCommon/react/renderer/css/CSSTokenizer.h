/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cmath>
#include <string_view>

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
  Percentage,
  WhiteSpace,
};

/*
 * Represents one of the syntactic CSS tokens as provided by
 * https://www.w3.org/TR/css-syntax-3/#tokenization
 */
class CSSToken {
 public:
  explicit constexpr CSSToken(CSSTokenType type) : type_(type) {}
  constexpr CSSToken(CSSTokenType type, std::string_view value)
      : type_{type}, stringValue_{value} {}
  constexpr CSSToken(CSSTokenType type, float value)
      : type_{type}, numericValue_{value} {}
  constexpr CSSToken(CSSTokenType type, float value, std::string_view unit)
      : type_{type}, numericValue_{value}, unit_{unit} {}

  constexpr CSSToken(const CSSToken& other) = default;
  constexpr CSSToken(CSSToken&& other) = default;
  constexpr CSSToken& operator=(const CSSToken& other) = default;
  constexpr CSSToken& operator=(CSSToken&& other) = default;

  constexpr CSSTokenType type() const {
    return type_;
  }

  constexpr std::string_view stringValue() const {
    return stringValue_;
  }

  constexpr float numericValue() const {
    return numericValue_;
  }

  constexpr std::string_view unit() const {
    return unit_;
  }

  constexpr bool operator==(const CSSToken& other) const = default;

 private:
  CSSTokenType type_;
  std::string_view stringValue_;
  float numericValue_{0.0f};
  std::string_view unit_;
};

/**
 * A minimal tokenizer for a subset of CSS syntax.
 * `auto`).
 *
 * This is based on the W3C CSS Syntax specification, with simplifications made
 * for syntax which React Native does not attempt to support.
 * https://www.w3.org/TR/css-syntax-3/#tokenizing-and-parsing
 */
class CSSTokenizer {
 public:
  explicit constexpr CSSTokenizer(std::string_view characters)
      : remainingCharacters_{characters} {}

  constexpr CSSToken next() {
    // https://www.w3.org/TR/css-syntax-3/#token-diagrams
    char nextChar = peek();
    if (isWhitespace(nextChar)) {
      return consumeWhitespace();
    } else if (nextChar == '+') {
      if (isDigit(peekNext())) {
        return consumeNumeric();
      } else {
        return consumeDelim();
      }
    } else if (nextChar == '-') {
      if (isDigit(peekNext())) {
        return consumeNumeric();
      } else {
        return consumeDelim();
      }
    } else if (isDigit(nextChar)) {
      return consumeNumeric();
    } else if (isIdentStart(nextChar)) {
      return consumeIdent();
    } else if (nextChar == '\0') {
      return CSSToken{CSSTokenType::EndOfFile};
    } else {
      return consumeDelim();
    }
  }

 private:
  constexpr char peek() const {
    auto index = position_;
    return index >= remainingCharacters_.size() ? '\0'
                                                : remainingCharacters_[index];
  }
  constexpr char peekNext() const {
    auto index = position_ + 1;
    return index >= remainingCharacters_.size() ? '\0'
                                                : remainingCharacters_[index];
  }

  constexpr void advance() {
    position_ += 1;
  }

  constexpr CSSToken consumeDelim() {
    advance();
    return {CSSTokenType::Delim, consumeRunningValue()};
  }

  constexpr CSSToken consumeWhitespace() {
    while (isWhitespace(peek())) {
      advance();
    }

    consumeRunningValue();
    return CSSToken{CSSTokenType::WhiteSpace};
  }

  constexpr CSSToken consumeNumber() {
    // https://www.w3.org/TR/css-syntax-3/#consume-number
    // https://www.w3.org/TR/css-syntax-3/#convert-a-string-to-a-number
    int32_t signPart = 1.0;
    if (peek() == '+' || peek() == '-') {
      if (peek() == '-') {
        signPart = -1.0;
      }
      advance();
    }

    int32_t intPart = 0;
    while (isDigit(peek())) {
      intPart = intPart * 10 + (peek() - '0');
      advance();
    }

    int32_t fractionalPart = 0;
    int32_t fractionDigits = 0;
    if (peek() == '.') {
      advance();
      while (isDigit(peek())) {
        fractionalPart = fractionalPart * 10 + (peek() - '0');
        fractionDigits++;
        advance();
      }
    }

    int32_t exponentSign = 1.0;
    int32_t exponentPart = 0;
    if (peek() == 'e' || peek() == 'E') {
      advance();
      if (peek() == '+' || peek() == '-') {
        if (peek() == '-') {
          exponentSign = -1.0;
        }
        advance();
      }

      while (isDigit(peek())) {
        exponentPart = exponentPart * 10 + (peek() - '0');
        advance();
      }
    }
    float value;
    if (exponentPart == 0 && fractionalPart == 0) {
      value = static_cast<float>(signPart * intPart);
    } else {
      value = static_cast<float>(
          signPart *
          (intPart + (fractionalPart * std::pow(10, -fractionDigits))) *
          std::pow(10, exponentSign * exponentPart));
    }

    consumeRunningValue();
    return {CSSTokenType::Number, value};
  }

  constexpr CSSToken consumeNumeric() {
    // https://www.w3.org/TR/css-syntax-3/#consume-numeric-token
    auto numberToken = consumeNumber();

    if (isIdent(peek())) {
      auto ident = consumeIdent();
      return {
          CSSTokenType::Dimension,
          numberToken.numericValue(),
          ident.stringValue()};
    } else if (peek() == '%') {
      advance();
      consumeRunningValue();
      return {CSSTokenType::Percentage, numberToken.numericValue()};
    } else {
      return numberToken;
    }
  }

  constexpr CSSToken consumeIdent() {
    // https://www.w3.org/TR/css-syntax-3/#consume-an-ident-sequence
    while (isIdent(peek())) {
      advance();
    }

    return {CSSTokenType::Ident, consumeRunningValue()};
  }

  constexpr std::string_view consumeRunningValue() {
    auto next = remainingCharacters_.substr(0, position_);
    remainingCharacters_ = remainingCharacters_.substr(next.size());
    position_ = 0;
    return next;
  }

  static constexpr bool isDigit(char c) {
    // https://www.w3.org/TR/css-syntax-3/#digit
    return c >= '0' && c <= '9';
  }

  static constexpr bool isIdentStart(char c) {
    // https://www.w3.org/TR/css-syntax-3/#ident-start-code-point
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_' ||
        static_cast<unsigned char>(c) > 0x80;
  }

  static constexpr bool isIdent(char c) {
    {
      // https://www.w3.org/TR/css-syntax-3/#ident-code-point
      return isIdentStart(c) || isDigit(c) || c == '-';
    }
  }

  static constexpr bool isWhitespace(char c) {
    // https://www.w3.org/TR/css-syntax-3/#whitespace
    return c == ' ' || c == '\t' || c == '\r' || c == '\n';
  }

  std::string_view remainingCharacters_;
  size_t position_{0};
};
} // namespace facebook::react

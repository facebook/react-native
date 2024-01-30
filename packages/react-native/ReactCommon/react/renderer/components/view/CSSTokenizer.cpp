/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cmath>
#include <cstdint>

#include <react/debug/react_native_assert.h>
#include <react/renderer/components/view/CSSTokenizer.h>

namespace facebook::react {

CSSTokenizer::CSSTokenizer(std::string_view characters)
    : remainingCharacters_{characters} {}

CSSToken CSSTokenizer::next() {
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

char CSSTokenizer::peek() const {
  auto index = position_;
  return index >= remainingCharacters_.size() ? '\0'
                                              : remainingCharacters_[index];
}

char CSSTokenizer::peekNext() const {
  auto index = position_ + 1;
  return index >= remainingCharacters_.size() ? '\0'
                                              : remainingCharacters_[index];
}

void CSSTokenizer::advance() {
  react_native_assert(remainingCharacters_.size() > position_);
  position_ += 1;
}

CSSToken CSSTokenizer::consumeDelim() {
  advance();
  return {CSSTokenType::Delim, consumeRunningValue()};
}

CSSToken CSSTokenizer::consumeWhitespace() {
  while (isWhitespace(peek())) {
    advance();
  }

  consumeRunningValue();
  return CSSToken{CSSTokenType::WhiteSpace};
}

CSSToken CSSTokenizer::consumeNumber() {
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

  auto value = static_cast<float>(
      signPart * (intPart + (fractionalPart * std::pow(10, -fractionDigits))) *
      std::pow(10, exponentSign * exponentPart));

  consumeRunningValue();
  return {CSSTokenType::Number, value};
}

CSSToken CSSTokenizer::consumeNumeric() {
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
    return {CSSTokenType::Percent, numberToken.numericValue()};
  } else {
    return numberToken;
  }
}

CSSToken CSSTokenizer::consumeIdent() {
  // https://www.w3.org/TR/css-syntax-3/#consume-an-ident-sequence
  while (isIdent(peek())) {
    advance();
  }

  return {CSSTokenType::Ident, consumeRunningValue()};
}

std::string_view CSSTokenizer::consumeRunningValue() {
  auto next = remainingCharacters_.substr(0, position_);
  remainingCharacters_ = remainingCharacters_.substr(next.size());
  position_ = 0;
  return next;
}

/*static*/ bool CSSTokenizer::isDigit(char c) {
  // https://www.w3.org/TR/css-syntax-3/#digit
  return c >= '0' && c <= '9';
}

/*static*/ bool CSSTokenizer::isIdentStart(char c) {
  // https://www.w3.org/TR/css-syntax-3/#ident-start-code-point
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_' ||
      static_cast<unsigned char>(c) > 0x80;
}

/*static*/ bool CSSTokenizer::isIdent(char c) {
  // https://www.w3.org/TR/css-syntax-3/#ident-code-point
  return isIdentStart(c) || isDigit(c) || c == '-';
}

/*static*/ bool CSSTokenizer::isWhitespace(char c) {
  // https://www.w3.org/TR/css-syntax-3/#whitespace
  return c == ' ' || c == '\t' || c == '\r' || c == '\n';
}

} // namespace facebook::react

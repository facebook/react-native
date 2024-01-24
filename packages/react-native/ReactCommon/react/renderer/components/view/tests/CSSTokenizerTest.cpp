/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/components/view/CSSTokenizer.h>
#include <deque>

namespace facebook::react {

static void expectTokens(
    std::string_view tokenStream,
    std::initializer_list<CSSToken> tokens) {
  CSSTokenizer tokenizer{tokenStream};
  std::deque tokenQueue(tokens.begin(), tokens.end());

  while (!tokenQueue.empty()) {
    auto nextToken = tokenizer.next();
    auto nextExpectedToken = tokenQueue.front();
    tokenQueue.pop_front();
    EXPECT_EQ(nextToken.type(), nextExpectedToken.type());
    EXPECT_EQ(nextToken.stringValue(), nextExpectedToken.stringValue());
    EXPECT_EQ(nextToken.numericValue(), nextExpectedToken.numericValue());
    EXPECT_EQ(nextToken.unit(), nextExpectedToken.unit());
  }
}

TEST(CSSTokenizer, eof) {
  expectTokens("", {{CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, whitespace) {
  expectTokens(" ", {{CSSTokenType::WhiteSpace}, {CSSTokenType::EndOfFile}});
  expectTokens(" \t", {{CSSTokenType::WhiteSpace}, {CSSTokenType::EndOfFile}});
  expectTokens(
      "\n   \t", {{CSSTokenType::WhiteSpace}, {CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, ident_value) {
  expectTokens(
      "auto", {{CSSTokenType::Ident, "auto"}, {CSSTokenType::EndOfFile}});

  expectTokens(
      "inset auto left",
      {{CSSTokenType::Ident, "inset"},
       {CSSTokenType::WhiteSpace},
       {CSSTokenType::Ident, "auto"},
       {CSSTokenType::WhiteSpace},
       {CSSTokenType::Ident, "left"},
       {CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, number_values) {
  expectTokens(
      "12", {{CSSTokenType::Number, 12.0f}, {CSSTokenType::EndOfFile}});

  expectTokens(
      "-5", {{CSSTokenType::Number, -5.0f}, {CSSTokenType::EndOfFile}});

  expectTokens(
      "123.0", {{CSSTokenType::Number, 123.0f}, {CSSTokenType::EndOfFile}});

  expectTokens(
      "4.2E-1", {{CSSTokenType::Number, 4.2e-1}, {CSSTokenType::EndOfFile}});

  expectTokens(
      "6e-10", {{CSSTokenType::Number, 6e-10f}, {CSSTokenType::EndOfFile}});

  expectTokens(
      "+81.07e+0",
      {{CSSTokenType::Number, +81.07e+0}, {CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, dimension_values) {
  expectTokens(
      "12px",
      {{CSSTokenType::Dimension, 12.0f, "px"}, {CSSTokenType::EndOfFile}});

  expectTokens(
      "463.2abc",
      {{CSSTokenType::Dimension, 463.2, "abc"}, {CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, percent_values) {
  expectTokens(
      "12%", {{CSSTokenType::Percent, 12.0f}, {CSSTokenType::EndOfFile}});

  expectTokens(
      "-28.5%", {{CSSTokenType::Percent, -28.5f}, {CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, mixed_values) {
  expectTokens(
      "12px   -100vh",
      {{CSSTokenType::Dimension, 12.0f, "px"},
       {CSSTokenType::WhiteSpace},
       {CSSTokenType::Dimension, -100.0f, "vh"},
       {CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, invalid_values) {
  expectTokens(
      "100*",
      {{CSSTokenType::Number, 100.0f},
       {CSSTokenType::Delim, "*"},
       {CSSTokenType::EndOfFile}});

  expectTokens("+", {{CSSTokenType::Delim, "+"}, {CSSTokenType::EndOfFile}});

  expectTokens(
      "(%",
      {{CSSTokenType::Delim, "("},
       {CSSTokenType::Delim, "%"},
       {CSSTokenType::EndOfFile}});
}

} // namespace facebook::react

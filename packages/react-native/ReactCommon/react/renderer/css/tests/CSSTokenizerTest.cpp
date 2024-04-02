/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSTokenizer.h>

namespace facebook::react {

static void expectTokens(
    std::string_view characters,
    std::initializer_list<CSSToken> expectedTokens) {
  CSSTokenizer tokenizer{characters};

  for (const auto& expectedToken : expectedTokens) {
    auto nextToken = tokenizer.next();
    EXPECT_EQ(nextToken.type(), expectedToken.type());
    EXPECT_EQ(nextToken.stringValue(), expectedToken.stringValue());
    EXPECT_EQ(nextToken.numericValue(), expectedToken.numericValue());
    EXPECT_EQ(nextToken.unit(), expectedToken.unit());
    EXPECT_EQ(nextToken, expectedToken);
  }
}

TEST(CSSTokenizer, eof_values) {
  expectTokens("", {CSSToken{CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, whitespace_values) {
  expectTokens(
      " ",
      {CSSToken{CSSTokenType::WhiteSpace}, CSSToken{CSSTokenType::EndOfFile}});
  expectTokens(
      " \t",
      {CSSToken{CSSTokenType::WhiteSpace}, CSSToken{CSSTokenType::EndOfFile}});
  expectTokens(
      "\n   \t",
      {CSSToken{CSSTokenType::WhiteSpace}, CSSToken{CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, ident_values) {
  expectTokens(
      "auto",
      {CSSToken{CSSTokenType::Ident, "auto"},
       CSSToken{CSSTokenType::EndOfFile}});

  expectTokens(
      "inset auto left",
      {CSSToken{CSSTokenType::Ident, "inset"},
       CSSToken{CSSTokenType::WhiteSpace},
       CSSToken{CSSTokenType::Ident, "auto"},
       CSSToken{CSSTokenType::WhiteSpace},
       CSSToken{CSSTokenType::Ident, "left"},
       CSSToken{CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, number_values) {
  expectTokens(
      "12",
      {CSSToken{CSSTokenType::Number, 12.0f},
       CSSToken{CSSTokenType::EndOfFile}});

  expectTokens(
      "-5",
      {CSSToken{CSSTokenType::Number, -5.0f},
       CSSToken{CSSTokenType::EndOfFile}});

  expectTokens(
      "123.0",
      {CSSToken{CSSTokenType::Number, 123.0f},
       CSSToken{CSSTokenType::EndOfFile}});

  expectTokens(
      "4.2E-1",
      {CSSToken{CSSTokenType::Number, 4.2e-1},
       CSSToken{CSSTokenType::EndOfFile}});

  expectTokens(
      "6e-10",
      {CSSToken{CSSTokenType::Number, 6e-10f},
       CSSToken{CSSTokenType::EndOfFile}});

  expectTokens(
      "+81.07e+0",
      {CSSToken{CSSTokenType::Number, +81.07e+0},
       CSSToken{CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, dimension_values) {
  expectTokens(
      "12px",
      {CSSToken{CSSTokenType::Dimension, 12.0f, "px"},
       CSSToken{CSSTokenType::EndOfFile}});

  expectTokens(
      "463.2abc",
      {CSSToken{CSSTokenType::Dimension, 463.2, "abc"},
       CSSToken{CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, percent_values) {
  expectTokens(
      "12%",
      {CSSToken{CSSTokenType::Percentage, 12.0f},
       CSSToken{CSSTokenType::EndOfFile}});

  expectTokens(
      "-28.5%",
      {CSSToken{CSSTokenType::Percentage, -28.5f},
       CSSToken{CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, mixed_values) {
  expectTokens(
      "12px   -100vh",
      {CSSToken{CSSTokenType::Dimension, 12.0f, "px"},
       CSSToken{CSSTokenType::WhiteSpace},
       CSSToken{CSSTokenType::Dimension, -100.0f, "vh"},
       CSSToken{CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, ratio_values) {
  expectTokens(
      "16 / 9",
      {CSSToken{CSSTokenType::Number, 16.0f},
       CSSToken{CSSTokenType::WhiteSpace},
       CSSToken{CSSTokenType::Delim, "/"},
       CSSToken{CSSTokenType::WhiteSpace},
       CSSToken{CSSTokenType::Number, 9.0f},
       CSSToken{CSSTokenType::EndOfFile}});
}

TEST(CSSTokenizer, invalid_values) {
  expectTokens(
      "100*",
      {CSSToken{CSSTokenType::Number, 100.0f},
       CSSToken{CSSTokenType::Delim, "*"},
       CSSToken{CSSTokenType::EndOfFile}});

  expectTokens(
      "+",
      {CSSToken{CSSTokenType::Delim, "+"}, CSSToken{CSSTokenType::EndOfFile}});

  expectTokens(
      "(%",
      {CSSToken{CSSTokenType::Delim, "("},
       CSSToken{CSSTokenType::Delim, "%"},
       CSSToken{CSSTokenType::EndOfFile}});
}

} // namespace facebook::react

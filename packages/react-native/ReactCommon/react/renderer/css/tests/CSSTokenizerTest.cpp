/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSTokenizer.h>

namespace facebook::react {

#define EXPECT_TOKENS(characters, ...)                                   \
  {                                                                      \
    CSSTokenizer tokenizer{characters};                                  \
                                                                         \
    for (const auto& expectedToken :                                     \
         std::initializer_list<CSSToken>{__VA_ARGS__}) {                 \
      auto nextToken = tokenizer.next();                                 \
      EXPECT_EQ(nextToken.type(), expectedToken.type());                 \
      EXPECT_EQ(nextToken.stringValue(), expectedToken.stringValue());   \
      EXPECT_EQ(nextToken.numericValue(), expectedToken.numericValue()); \
      EXPECT_EQ(nextToken.unit(), expectedToken.unit());                 \
      EXPECT_EQ(nextToken, expectedToken);                               \
    }                                                                    \
  }

TEST(CSSTokenizer, eof_values) {
  EXPECT_TOKENS("", CSSToken{CSSTokenType::EndOfFile});
}

TEST(CSSTokenizer, whitespace_values) {
  EXPECT_TOKENS(
      " ",
      CSSToken{CSSTokenType::WhiteSpace},
      CSSToken{CSSTokenType::EndOfFile});
  EXPECT_TOKENS(
      " \t",
      CSSToken{CSSTokenType::WhiteSpace},
      CSSToken{CSSTokenType::EndOfFile});
  EXPECT_TOKENS(
      "\n   \t",
      CSSToken{CSSTokenType::WhiteSpace},
      CSSToken{CSSTokenType::EndOfFile});
}

TEST(CSSTokenizer, ident_values) {
  EXPECT_TOKENS(
      "auto",
      CSSToken{CSSTokenType::Ident, "auto"},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "inset auto left",
      CSSToken{CSSTokenType::Ident, "inset"},
      CSSToken{CSSTokenType::WhiteSpace},
      CSSToken{CSSTokenType::Ident, "auto"},
      CSSToken{CSSTokenType::WhiteSpace},
      CSSToken{CSSTokenType::Ident, "left"},
      CSSToken{CSSTokenType::EndOfFile});
}

TEST(CSSTokenizer, number_values) {
  EXPECT_TOKENS(
      "12",
      CSSToken{CSSTokenType::Number, 12.0f},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "-5",
      CSSToken{CSSTokenType::Number, -5.0f},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "123.0",
      CSSToken{CSSTokenType::Number, 123.0f},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "4.2E-1",
      CSSToken{CSSTokenType::Number, 4.2e-1},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "6e-10",
      CSSToken{CSSTokenType::Number, 6e-10f},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "+81.07e+0",
      CSSToken{CSSTokenType::Number, +81.07e+0},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "+.123e+0",
      CSSToken{CSSTokenType::Number, +.123e+0},
      CSSToken{CSSTokenType::EndOfFile});
}

TEST(CSSTokenizer, dimension_values) {
  EXPECT_TOKENS(
      "12px",
      CSSToken{CSSTokenType::Dimension, 12.0f, "px"},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "463.2abc",
      CSSToken{CSSTokenType::Dimension, 463.2, "abc"},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      ".3xyz",
      CSSToken{CSSTokenType::Dimension, 0.3, "xyz"},
      CSSToken{CSSTokenType::EndOfFile});
}

TEST(CSSTokenizer, percent_values) {
  EXPECT_TOKENS(
      "12%",
      CSSToken{CSSTokenType::Percentage, 12.0f},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "-28.5%",
      CSSToken{CSSTokenType::Percentage, -28.5f},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      ".02%",
      CSSToken{CSSTokenType::Percentage, 0.02f},
      CSSToken{CSSTokenType::EndOfFile});
}

TEST(CSSTokenizer, mixed_values) {
  EXPECT_TOKENS(
      "12px   -100vh",
      CSSToken{CSSTokenType::Dimension, 12.0f, "px"},
      CSSToken{CSSTokenType::WhiteSpace},
      CSSToken{CSSTokenType::Dimension, -100.0f, "vh"},
      CSSToken{CSSTokenType::EndOfFile});
}

TEST(CSSTokenizer, ratio_values) {
  EXPECT_TOKENS(
      "16 / 9",
      CSSToken{CSSTokenType::Number, 16.0f},
      CSSToken{CSSTokenType::WhiteSpace},
      CSSToken{CSSTokenType::Delim, "/"},
      CSSToken{CSSTokenType::WhiteSpace},
      CSSToken{CSSTokenType::Number, 9.0f},
      CSSToken{CSSTokenType::EndOfFile});
}

TEST(CSSTokenizer, function_values) {
  EXPECT_TOKENS(
      "blur(50px)",
      CSSToken{CSSTokenType::Function, "blur"},
      CSSToken{CSSTokenType::Dimension, 50.0f, "px"},
      CSSToken{CSSTokenType::CloseParen},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "scale3d( 1.2, 150% 0.5) ",
      CSSToken{CSSTokenType::Function, "scale3d"},
      CSSToken{CSSTokenType::WhiteSpace},
      CSSToken{CSSTokenType::Number, 1.2f},
      CSSToken{CSSTokenType::Comma},
      CSSToken{CSSTokenType::WhiteSpace},
      CSSToken{CSSTokenType::Percentage, 150.f},
      CSSToken{CSSTokenType::WhiteSpace},
      CSSToken{CSSTokenType::Number, 0.5f},
      CSSToken{CSSTokenType::CloseParen},
      CSSToken{CSSTokenType::WhiteSpace},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "blur (50px)",
      CSSToken{CSSTokenType::Ident, "blur"},
      CSSToken{CSSTokenType::WhiteSpace},
      CSSToken{CSSTokenType::OpenParen},
      CSSToken{CSSTokenType::Dimension, 50.0f, "px"},
      CSSToken{CSSTokenType::CloseParen},
      CSSToken{CSSTokenType::EndOfFile});
}

TEST(CSSTokenizer, invalid_values) {
  EXPECT_TOKENS(
      "100*",
      CSSToken{CSSTokenType::Number, 100.0f},
      CSSToken{CSSTokenType::Delim, "*"},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "+",
      CSSToken{CSSTokenType::Delim, "+"},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "(%",
      CSSToken{CSSTokenType::OpenParen},
      CSSToken{CSSTokenType::Delim, "%"},
      CSSToken{CSSTokenType::EndOfFile});
}

TEST(CSSTokenizer, hash_values) {
  EXPECT_TOKENS(
      "#Ff03BC",
      CSSToken{CSSTokenType::Hash, "Ff03BC"},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "#identifier",
      CSSToken{CSSTokenType::Hash, "identifier"},
      CSSToken{CSSTokenType::EndOfFile});

  EXPECT_TOKENS(
      "#*",
      CSSToken{CSSTokenType::Delim, "#"},
      CSSToken{CSSTokenType::Delim, "*"},
      CSSToken{CSSTokenType::EndOfFile});
}
} // namespace facebook::react

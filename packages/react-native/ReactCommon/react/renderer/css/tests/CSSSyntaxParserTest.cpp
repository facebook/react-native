/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSSyntaxParser.h>

namespace facebook::react {

static void consumeFunction(
    CSSSyntaxParser& parser,
    CSSFunctionVisitor<void> auto&& visitor) {
  EXPECT_TRUE(
      parser.consumeComponentValue<bool>([&](const CSSFunctionBlock& function) {
        visitor(function);
        return true;
      }));
}

static void consumePreservedToken(
    CSSSyntaxParser& parser,
    CSSPreservedTokenVisitor<void> auto&& visitor) {
  EXPECT_TRUE(
      parser.consumeComponentValue<bool>([&](const CSSPreservedToken& token) {
        visitor(token);
        return true;
      }));
}

TEST(CSSSyntaxParser, simple) {
  CSSSyntaxParser parser{"1px solid black"};

  consumePreservedToken(parser, [](const CSSPreservedToken& token) {
    EXPECT_EQ(token.type(), CSSTokenType::Dimension);
    EXPECT_EQ(token.numericValue(), 1.0f);
    EXPECT_EQ(token.unit(), "px");
  });

  consumePreservedToken(parser, [](const CSSPreservedToken& token) {
    EXPECT_EQ(token.type(), CSSTokenType::WhiteSpace);
  });

  consumePreservedToken(parser, [](const CSSPreservedToken& token) {
    EXPECT_EQ(token.type(), CSSTokenType::Ident);
    EXPECT_EQ(token.stringValue(), "solid");
  });

  consumePreservedToken(parser, [](const CSSPreservedToken& token) {
    EXPECT_EQ(token.type(), CSSTokenType::WhiteSpace);
  });

  consumePreservedToken(parser, [](const CSSPreservedToken& token) {
    EXPECT_EQ(token.type(), CSSTokenType::Ident);
    EXPECT_EQ(token.stringValue(), "black");
  });
}

TEST(CSSSyntaxParser, single_function_no_args) {
  CSSSyntaxParser parser{"foo()"};

  consumeFunction(parser, [&](const CSSFunctionBlock& function) {
    EXPECT_EQ(function.name, "foo");
  });
}

TEST(CSSSyntaxParser, single_function_with_args) {
  CSSSyntaxParser parser{"foo(a b, c)"};

  consumeFunction(parser, [&](const CSSFunctionBlock& function) {
    EXPECT_EQ(function.name, "foo");

    consumePreservedToken(parser, [](const CSSPreservedToken& token) {
      EXPECT_EQ(token.type(), CSSTokenType::Ident);
      EXPECT_EQ(token.stringValue(), "a");
    });

    consumePreservedToken(parser, [](const CSSPreservedToken& token) {
      EXPECT_EQ(token.type(), CSSTokenType::WhiteSpace);
    });

    consumePreservedToken(parser, [](const CSSPreservedToken& token) {
      EXPECT_EQ(token.type(), CSSTokenType::Ident);
      EXPECT_EQ(token.stringValue(), "b");
    });

    consumePreservedToken(parser, [](const CSSPreservedToken& token) {
      EXPECT_EQ(token.type(), CSSTokenType::Comma);
    });

    consumePreservedToken(parser, [](const CSSPreservedToken& token) {
      EXPECT_EQ(token.type(), CSSTokenType::WhiteSpace);
    });

    consumePreservedToken(parser, [](const CSSPreservedToken& token) {
      EXPECT_EQ(token.type(), CSSTokenType::Ident);
      EXPECT_EQ(token.stringValue(), "c");
    });
  });
}

TEST(CSSSyntaxParser, complex) {
  CSSSyntaxParser parser{"foo(a bar())baz() 12px"};

  consumeFunction(parser, [&](const CSSFunctionBlock& function) {
    EXPECT_EQ(function.name, "foo");

    consumePreservedToken(parser, [](const CSSPreservedToken& token) {
      EXPECT_EQ(token.type(), CSSTokenType::Ident);
      EXPECT_EQ(token.stringValue(), "a");
    });

    consumePreservedToken(parser, [](const CSSPreservedToken& token) {
      EXPECT_EQ(token.type(), CSSTokenType::WhiteSpace);
    });

    consumeFunction(parser, [&](const CSSFunctionBlock& function) {
      EXPECT_EQ(function.name, "bar");
    });
  });

  consumeFunction(parser, [&](const CSSFunctionBlock& function) {
    EXPECT_EQ(function.name, "baz");
  });

  consumePreservedToken(parser, [](const CSSPreservedToken& token) {
    EXPECT_EQ(token.type(), CSSTokenType::WhiteSpace);
  });

  consumePreservedToken(parser, [](const CSSPreservedToken& token) {
    EXPECT_EQ(token.type(), CSSTokenType::Dimension);
    EXPECT_EQ(token.numericValue(), 12.0f);
    EXPECT_EQ(token.unit(), "px");
  });
}

TEST(CSSSyntaxParser, unterminated_functions) {
  EXPECT_FALSE(CSSSyntaxParser{"foo("}.consumeComponentValue<bool>(
      [](const CSSFunctionBlock&) { return true; }));

  EXPECT_FALSE(CSSSyntaxParser{"foo(a bar()baz()"}.consumeComponentValue<bool>(
      [](const CSSFunctionBlock&) { return true; }));
}

TEST(CSSSyntaxParser, value_propagation) {
  CSSSyntaxParser parser{"1px"};

  auto length = parser.consumeComponentValue<float>(
      [&](const CSSPreservedToken& token) { return token.numericValue(); });

  EXPECT_EQ(length, 1.0f);
}

TEST(CSSSyntaxParser, simple_blocks) {
  CSSSyntaxParser parser1{"(a)"};
  auto identValue = parser1.consumeComponentValue<std::string_view>(
      [&](const CSSSimpleBlock& block) {
        EXPECT_EQ(block.openBracketType, CSSTokenType::OpenParen);
        return parser1.consumeComponentValue<std::string_view>(
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              return token.stringValue();
            });
      });
  EXPECT_EQ(identValue, "a");

  CSSSyntaxParser parser2{"[b ]"};
  auto identValue2 = parser2.consumeComponentValue<std::string_view>(
      [&](const CSSSimpleBlock& block) {
        EXPECT_EQ(block.openBracketType, CSSTokenType::OpenSquare);
        return parser2.consumeComponentValue<std::string_view>(
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              return token.stringValue();
            });
      });
  EXPECT_EQ(identValue2, "b");

  CSSSyntaxParser parser3{"{c}"};
  auto identValue3 = parser3.consumeComponentValue<std::string_view>(
      [&](const CSSSimpleBlock& block) {
        EXPECT_EQ(block.openBracketType, CSSTokenType::OpenCurly);
        return parser3.consumeComponentValue<std::string_view>(
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              return token.stringValue();
            });
      });
  EXPECT_EQ(identValue3, "c");
}

TEST(CSSSyntaxParser, unterminated_simple_blocks) {
  CSSSyntaxParser parser1{"(a"};
  auto identValue = parser1.consumeComponentValue<std::string_view>(
      [&](const CSSSimpleBlock& block) {
        EXPECT_EQ(block.openBracketType, CSSTokenType::OpenParen);
        return parser1.consumeComponentValue<std::string_view>(
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              return token.stringValue();
            });
      });
  EXPECT_EQ(identValue, "");

  CSSSyntaxParser parser2{"[b "};
  auto identValue2 = parser2.consumeComponentValue<std::string_view>(
      [&](const CSSSimpleBlock& block) {
        EXPECT_EQ(block.openBracketType, CSSTokenType::OpenSquare);
        return parser2.consumeComponentValue<std::string_view>(
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              return token.stringValue();
            });
      });
  EXPECT_EQ(identValue2, "");

  CSSSyntaxParser parser3{"{c"};
  auto identValue3 = parser3.consumeComponentValue<std::string_view>(
      [&](const CSSSimpleBlock& block) {
        EXPECT_EQ(block.openBracketType, CSSTokenType::OpenCurly);
        return parser3.consumeComponentValue<std::string_view>(
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              return token.stringValue();
            });
      });
  EXPECT_EQ(identValue3, "");
}

} // namespace facebook::react

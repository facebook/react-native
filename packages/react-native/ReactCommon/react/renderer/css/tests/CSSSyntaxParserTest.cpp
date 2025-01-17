/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSSyntaxParser.h>

namespace facebook::react {

TEST(CSSSyntaxParser, simple) {
  CSSSyntaxParser parser{"1px solid black"};

  auto pxValue = parser.consumeComponentValue<float>(
      CSSComponentValueDelimiter::Whitespace,
      [](const CSSPreservedToken& token) {
        EXPECT_EQ(token.type(), CSSTokenType::Dimension);
        EXPECT_EQ(token.numericValue(), 1.0f);
        EXPECT_EQ(token.unit(), "px");
        return token.numericValue();
      });
  EXPECT_EQ(pxValue, 1.0f);

  auto identValue = parser.consumeComponentValue<std::string_view>(
      CSSComponentValueDelimiter::Whitespace,

      [](const CSSPreservedToken& token) {
        EXPECT_EQ(token.type(), CSSTokenType::Ident);
        EXPECT_EQ(token.stringValue(), "solid");
        return token.stringValue();
      });
  EXPECT_EQ(identValue, "solid");

  auto identValue2 = parser.consumeComponentValue<std::string_view>(
      CSSComponentValueDelimiter::Whitespace,
      [](const CSSPreservedToken& token) {
        EXPECT_EQ(token.type(), CSSTokenType::Ident);
        EXPECT_EQ(token.stringValue(), "black");
        return token.stringValue();
      });
  EXPECT_EQ(identValue2, "black");
}

TEST(CSSSyntaxParser, single_function_no_args) {
  CSSSyntaxParser parser{"foo()"};

  auto funcName = parser.consumeComponentValue<std::string_view>(
      [](const CSSFunctionBlock& function, CSSSyntaxParser& blockParser) {
        EXPECT_EQ(function.name, "foo");
        return function.name;

        auto hasMoreTokens = blockParser.consumeComponentValue<bool>(
            CSSComponentValueDelimiter::Whitespace,
            [](const CSSPreservedToken& /*token*/) { return true; });

        EXPECT_FALSE(hasMoreTokens);
      });
  EXPECT_EQ(funcName, "foo");
}

TEST(CSSSyntaxParser, single_function_with_whitespace_delimited_args) {
  CSSSyntaxParser parser{"foo( a b c)"};

  auto funcArgs = parser.consumeComponentValue<std::vector<std::string>>(
      [&](const CSSFunctionBlock& function, CSSSyntaxParser& blockParser) {
        EXPECT_EQ(function.name, "foo");

        std::vector<std::string> args;

        args.emplace_back(blockParser.consumeComponentValue<std::string_view>(
            CSSComponentValueDelimiter::Whitespace,

            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              EXPECT_EQ(token.stringValue(), "a");
              return token.stringValue();
            }));

        args.emplace_back(blockParser.consumeComponentValue<std::string_view>(
            CSSComponentValueDelimiter::Whitespace,

            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              EXPECT_EQ(token.stringValue(), "b");
              return token.stringValue();
            }));

        args.emplace_back(blockParser.consumeComponentValue<std::string_view>(
            CSSComponentValueDelimiter::Whitespace,

            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              EXPECT_EQ(token.stringValue(), "c");
              return token.stringValue();
            }));

        auto hasMoreTokens = blockParser.consumeComponentValue<bool>(
            CSSComponentValueDelimiter::Whitespace,
            [](const CSSPreservedToken& /*token*/) { return true; });

        EXPECT_FALSE(hasMoreTokens);

        return args;
      });

  std::vector<std::string> expectedArgs{"a", "b", "c"};
  EXPECT_EQ(funcArgs, expectedArgs);
}

TEST(CSSSyntaxParser, single_function_with_comma_delimited_args) {
  CSSSyntaxParser parser{"rgb(100, 200, 50 )"};

  auto funcArgs = parser.consumeComponentValue<std::array<uint8_t, 3>>(
      [&](const CSSFunctionBlock& function, CSSSyntaxParser& blockParser) {
        EXPECT_EQ(function.name, "rgb");

        std::array<uint8_t, 3> rgb{};

        rgb[0] = blockParser.consumeComponentValue<uint8_t>(
            CSSComponentValueDelimiter::Whitespace,
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Number);
              EXPECT_EQ(token.numericValue(), 100);
              return static_cast<uint8_t>(token.numericValue());
            });

        rgb[1] = blockParser.consumeComponentValue<uint8_t>(
            CSSComponentValueDelimiter::Comma,
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Number);
              EXPECT_EQ(token.numericValue(), 200);
              return static_cast<uint8_t>(token.numericValue());
            });

        rgb[2] = blockParser.consumeComponentValue<uint8_t>(
            CSSComponentValueDelimiter::Comma,
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Number);
              EXPECT_EQ(token.numericValue(), 50);
              return static_cast<uint8_t>(token.numericValue());
            });

        auto hasMoreTokens = blockParser.consumeComponentValue<bool>(
            CSSComponentValueDelimiter::Whitespace,
            [](const CSSPreservedToken& /*token*/) { return true; });

        EXPECT_FALSE(hasMoreTokens);

        return rgb;
      });

  std::array<uint8_t, 3> expectedArgs{{100, 200, 50}};
  EXPECT_EQ(funcArgs, expectedArgs);
}

TEST(CSSSyntaxParser, single_function_with_mixed_delimited_args) {
  CSSSyntaxParser parser{"rgb(100, 200 50 )"};

  auto funcArgs = parser.consumeComponentValue<std::array<uint8_t, 3>>(
      [&](const CSSFunctionBlock& function, CSSSyntaxParser& blockParser) {
        EXPECT_EQ(function.name, "rgb");

        std::array<uint8_t, 3> rgb{};

        rgb[0] = blockParser.consumeComponentValue<uint8_t>(
            CSSComponentValueDelimiter::None,
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Number);
              EXPECT_EQ(token.numericValue(), 100);
              return static_cast<uint8_t>(token.numericValue());
            });

        rgb[1] = blockParser.consumeComponentValue<uint8_t>(
            CSSComponentValueDelimiter::CommaOrWhitespace,
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Number);
              EXPECT_EQ(token.numericValue(), 200);
              return static_cast<uint8_t>(token.numericValue());
            });

        rgb[2] = blockParser.consumeComponentValue<uint8_t>(
            CSSComponentValueDelimiter::CommaOrWhitespace,
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Number);
              EXPECT_EQ(token.numericValue(), 50);
              return static_cast<uint8_t>(token.numericValue());
            });

        auto hasMoreTokens = blockParser.consumeComponentValue<bool>(
            CSSComponentValueDelimiter::Whitespace,
            [](const CSSPreservedToken& /*token*/) { return true; });

        EXPECT_FALSE(hasMoreTokens);

        return rgb;
      });

  std::array<uint8_t, 3> expectedArgs{{100, 200, 50}};
  EXPECT_EQ(funcArgs, expectedArgs);
}

TEST(CSSSyntaxParser, complex) {
  CSSSyntaxParser parser{"foo(a bar())baz() 12px"};

  auto fooFunc = parser.consumeComponentValue<std::string_view>(
      [&](const CSSFunctionBlock& function, CSSSyntaxParser& blockParser) {
        EXPECT_EQ(function.name, "foo");
        auto identArg = blockParser.consumeComponentValue<std::string_view>(
            CSSComponentValueDelimiter::Whitespace,
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              EXPECT_EQ(token.stringValue(), "a");
              return token.stringValue();
            });
        EXPECT_EQ(identArg, "a");

        auto barFunc = blockParser.consumeComponentValue<std::string_view>(
            CSSComponentValueDelimiter::Whitespace,
            [&](const CSSFunctionBlock& function,
                CSSSyntaxParser& nestedBlockParser) {
              EXPECT_EQ(function.name, "bar");
              auto hasMoreTokens =
                  nestedBlockParser.consumeComponentValue<bool>(
                      CSSComponentValueDelimiter::Whitespace,
                      [](const CSSPreservedToken& /*token*/) { return true; });
              EXPECT_FALSE(hasMoreTokens);

              return function.name;
            });
        EXPECT_EQ(barFunc, "bar");

        auto hasMoreTokens = blockParser.consumeComponentValue<bool>(
            CSSComponentValueDelimiter::Whitespace,
            [](const CSSPreservedToken& /*token*/) { return true; });
        EXPECT_FALSE(hasMoreTokens);

        return function.name;
      });
  EXPECT_EQ(fooFunc, "foo");

  auto bazFunc = parser.consumeComponentValue<std::string_view>(
      [&](const CSSFunctionBlock& function, CSSSyntaxParser& /*blockParser*/) {
        EXPECT_EQ(function.name, "baz");
        return function.name;
      });
  EXPECT_EQ(bazFunc, "baz");

  auto pxValue = parser.consumeComponentValue<float>(
      CSSComponentValueDelimiter::Whitespace,
      [](const CSSPreservedToken& token) {
        EXPECT_EQ(token.type(), CSSTokenType::Dimension);
        EXPECT_EQ(token.numericValue(), 12.0f);
        EXPECT_EQ(token.unit(), "px");
        return token.numericValue();
      });
  EXPECT_EQ(pxValue, 12.0f);
}

TEST(CSSSyntaxParser, unterminated_functions) {
  EXPECT_FALSE(CSSSyntaxParser{"foo("}.consumeComponentValue<bool>(
      [](const CSSFunctionBlock&, CSSSyntaxParser& /*blockParser*/) {
        return true;
      }));

  EXPECT_FALSE(CSSSyntaxParser{"foo(a bar()baz()"}.consumeComponentValue<bool>(
      [](const CSSFunctionBlock&, CSSSyntaxParser& /*blockParser*/) {
        return true;
      }));
}

TEST(CSSSyntaxParser, simple_blocks) {
  CSSSyntaxParser parser1{"(a)"};
  auto identValue = parser1.consumeComponentValue<std::string_view>(
      [&](const CSSSimpleBlock& block, CSSSyntaxParser& blockParser) {
        EXPECT_EQ(block.openBracketType, CSSTokenType::OpenParen);
        return blockParser.consumeComponentValue<std::string_view>(
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              return token.stringValue();
            });
      });
  EXPECT_EQ(identValue, "a");

  CSSSyntaxParser parser2{"[b ]"};
  auto identValue2 = parser2.consumeComponentValue<std::string_view>(
      [&](const CSSSimpleBlock& block, CSSSyntaxParser& blockParser) {
        EXPECT_EQ(block.openBracketType, CSSTokenType::OpenSquare);
        return blockParser.consumeComponentValue<std::string_view>(
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              return token.stringValue();
            });
      });
  EXPECT_EQ(identValue2, "b");

  CSSSyntaxParser parser3{"{c}"};
  auto identValue3 = parser3.consumeComponentValue<std::string_view>(
      [&](const CSSSimpleBlock& block, CSSSyntaxParser& blockParser) {
        EXPECT_EQ(block.openBracketType, CSSTokenType::OpenCurly);
        return blockParser.consumeComponentValue<std::string_view>(
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
      [&](const CSSSimpleBlock& block, CSSSyntaxParser& blockParser) {
        EXPECT_EQ(block.openBracketType, CSSTokenType::OpenParen);
        return blockParser.consumeComponentValue<std::string_view>(
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              return token.stringValue();
            });
      });
  EXPECT_EQ(identValue, "");

  CSSSyntaxParser parser2{"[b "};
  auto identValue2 = parser2.consumeComponentValue<std::string_view>(
      [&](const CSSSimpleBlock& block, CSSSyntaxParser& blockParser) {
        EXPECT_EQ(block.openBracketType, CSSTokenType::OpenSquare);
        return blockParser.consumeComponentValue<std::string_view>(
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              return token.stringValue();
            });
      });
  EXPECT_EQ(identValue2, "");

  CSSSyntaxParser parser3{"{c"};
  auto identValue3 = parser3.consumeComponentValue<std::string_view>(
      [&](const CSSSimpleBlock& block, CSSSyntaxParser& blockParser) {
        EXPECT_EQ(block.openBracketType, CSSTokenType::OpenCurly);
        return blockParser.consumeComponentValue<std::string_view>(
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              return token.stringValue();
            });
      });
  EXPECT_EQ(identValue3, "");
}

TEST(CSSSyntaxParser, unconsumed_function_args) {
  CSSSyntaxParser parser{"foo(a)"};
  auto funcValue =
      parser.consumeComponentValue<std::optional<std::string_view>>(
          [&](const CSSFunctionBlock& function,
              CSSSyntaxParser& /*blockParser*/) {
            EXPECT_EQ(function.name, "foo");
            return function.name;
          });

  EXPECT_EQ(funcValue, std::nullopt);
}

TEST(CSSSyntaxParser, whitespace_surrounding_function_args) {
  CSSSyntaxParser parser{"foo( a )"};
  auto funcValue = parser.consumeComponentValue<std::string_view>(
      [&](const CSSFunctionBlock& function, CSSSyntaxParser& blockParser) {
        EXPECT_EQ(function.name, "foo");

        auto identArg = blockParser.consumeComponentValue<std::string_view>(
            CSSComponentValueDelimiter::None,
            [](const CSSPreservedToken& token) {
              EXPECT_EQ(token.type(), CSSTokenType::Ident);
              EXPECT_EQ(token.stringValue(), "a");
              return token.stringValue();
            });

        EXPECT_EQ(identArg, "a");

        return function.name;
      });

  EXPECT_EQ(funcValue, "foo");
}

TEST(CSSSyntaxParser, unconsumed_simple_block_args) {
  CSSSyntaxParser parser{"{a}"};
  auto funcValue = parser.consumeComponentValue<std::optional<CSSTokenType>>(
      [&](const CSSSimpleBlock& block, CSSSyntaxParser& /*blockParser*/) {
        EXPECT_EQ(block.openBracketType, CSSTokenType::OpenCurly);
        return block.openBracketType;
      });

  EXPECT_EQ(funcValue, std::nullopt);
}

} // namespace facebook::react

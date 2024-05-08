/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSParser.h>

namespace facebook::react {

TEST(CSSParser, simple) {
  CSSParser parser{"1px solid black"};

  auto value = parser.consumeComponentValue();
  EXPECT_TRUE(std::holds_alternative<CSSToken>(value));
  EXPECT_EQ(std::get<CSSToken>(value).type(), CSSTokenType::Dimension);
  EXPECT_EQ(std::get<CSSToken>(value).numericValue(), 1.0f);
  EXPECT_EQ(std::get<CSSToken>(value).unit(), "px");

  value = parser.consumeComponentValue();
  EXPECT_TRUE(std::holds_alternative<CSSToken>(value));
  EXPECT_EQ(std::get<CSSToken>(value).type(), CSSTokenType::WhiteSpace);

  value = parser.consumeComponentValue();
  EXPECT_TRUE(std::holds_alternative<CSSToken>(value));
  EXPECT_EQ(std::get<CSSToken>(value).type(), CSSTokenType::Ident);
  EXPECT_EQ(std::get<CSSToken>(value).stringValue(), "solid");

  value = parser.consumeComponentValue();
  EXPECT_TRUE(std::holds_alternative<CSSToken>(value));
  EXPECT_EQ(std::get<CSSToken>(value).type(), CSSTokenType::WhiteSpace);

  value = parser.consumeComponentValue();
  EXPECT_TRUE(std::holds_alternative<CSSToken>(value));
  EXPECT_EQ(std::get<CSSToken>(value).type(), CSSTokenType::Ident);
  EXPECT_EQ(std::get<CSSToken>(value).stringValue(), "black");
}

TEST(CSSParser, parse_single_valid) {
  CSSParser parser{" 1px"};
  auto value = parser.parseComponentValue();

  EXPECT_TRUE(std::holds_alternative<CSSToken>(value));
  EXPECT_EQ(std::get<CSSToken>(value).type(), CSSTokenType::Dimension);
  EXPECT_EQ(std::get<CSSToken>(value).numericValue(), 1.0f);
  EXPECT_EQ(std::get<CSSToken>(value).unit(), "px");
}

TEST(CSSParser, parse_single_has_multiple) {
  CSSParser parser{" 1px 2px"};
  auto value = parser.parseComponentValue();
  EXPECT_TRUE(std::holds_alternative<std::monostate>(value));
}

TEST(CSSParser, single_function_no_args) {
  CSSParser parser{" foo() "};

  auto value = parser.parseComponentValue();
  EXPECT_TRUE(std::holds_alternative<CSSParser::FunctionComponentValue>(value));

  auto function = std::get<CSSParser::FunctionComponentValue>(value);
  EXPECT_EQ(function.name, "foo");
  EXPECT_TRUE(function.args.empty());
}

TEST(CSSParser, single_function_with_args) {
  CSSParser parser{"foo(a b, c)"};

  auto value = parser.parseComponentValue();
  EXPECT_TRUE(std::holds_alternative<CSSParser::FunctionComponentValue>(value));

  auto function = std::get<CSSParser::FunctionComponentValue>(value);
  EXPECT_EQ(function.name, "foo");
  EXPECT_EQ(function.args.size(), 6);

  auto arg0 = std::get<CSSToken>(function.args.at(0));
  EXPECT_EQ(arg0.type(), CSSTokenType::Ident);
  EXPECT_EQ(arg0.stringValue(), "a");

  auto arg1 = std::get<CSSToken>(function.args.at(1));
  EXPECT_EQ(arg1.type(), CSSTokenType::WhiteSpace);

  auto arg2 = std::get<CSSToken>(function.args.at(2));
  EXPECT_EQ(arg2.type(), CSSTokenType::Ident);
  EXPECT_EQ(arg2.stringValue(), "b");

  auto arg3 = std::get<CSSToken>(function.args.at(3));
  EXPECT_EQ(arg3.type(), CSSTokenType::Comma);

  auto arg4 = std::get<CSSToken>(function.args.at(4));
  EXPECT_EQ(arg4.type(), CSSTokenType::WhiteSpace);

  auto arg5 = std::get<CSSToken>(function.args.at(5));
  EXPECT_EQ(arg5.type(), CSSTokenType::Ident);
  EXPECT_EQ(arg5.stringValue(), "c");
}

TEST(CSSParser, complex) {
  CSSParser parser{"foo(a bar())baz() 12px"};

  auto function1 = std::get<CSSParser::FunctionComponentValue>(
      parser.consumeComponentValue());
  EXPECT_EQ(function1.name, "foo");
  EXPECT_EQ(function1.args.size(), 3);

  auto arg0 = std::get<CSSToken>(function1.args.at(0));
  EXPECT_EQ(arg0.type(), CSSTokenType::Ident);
  EXPECT_EQ(arg0.stringValue(), "a");

  auto arg1 = std::get<CSSToken>(function1.args.at(1));
  EXPECT_EQ(arg1.type(), CSSTokenType::WhiteSpace);

  auto arg2 = std::get<CSSParser::FunctionComponentValue>(function1.args.at(2));
  EXPECT_EQ(arg2.name, "bar");
  EXPECT_TRUE(arg2.args.empty());

  auto function2 = std::get<CSSParser::FunctionComponentValue>(
      parser.consumeComponentValue());
  EXPECT_EQ(function2.name, "baz");
  EXPECT_TRUE(function2.args.empty());

  auto ws = std::get<CSSToken>(parser.consumeComponentValue());
  EXPECT_EQ(ws.type(), CSSTokenType::WhiteSpace);

  auto dim = std::get<CSSToken>(parser.consumeComponentValue());
  EXPECT_EQ(dim.type(), CSSTokenType::Dimension);
  EXPECT_EQ(dim.numericValue(), 12.0f);
  EXPECT_EQ(dim.unit(), "px");
}

} // namespace facebook::react

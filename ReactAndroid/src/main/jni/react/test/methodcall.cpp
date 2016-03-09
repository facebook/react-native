// Copyright 2004-present Facebook. All Rights Reserved.

#include <gtest/gtest.h>
#include <react/MethodCall.h>

using namespace facebook;
using namespace facebook::react;

TEST(parseMethodCalls, SingleReturnCallNoArgs) {
  auto jsText = "[[7],[3],[[]]]";
  auto returnedCalls = parseMethodCalls(jsText);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(0, returnedCall.arguments.size());
  ASSERT_EQ(7, returnedCall.moduleId);
  ASSERT_EQ(3, returnedCall.methodId);
}

TEST(parseMethodCalls, InvalidReturnFormat) {
  ASSERT_TRUE(parseMethodCalls("{\"foo\":1}").empty());
  ASSERT_TRUE(parseMethodCalls("[{\"foo\":1}]").empty());
  ASSERT_TRUE(parseMethodCalls("[1,4,{\"foo\":2}]").empty());
  ASSERT_TRUE(parseMethodCalls("[[1],[4],{\"foo\":2}]").empty());
  ASSERT_TRUE(parseMethodCalls("[[1],[4],[]]").empty());
}

TEST(parseMethodCalls, NumberReturn) {
  auto jsText = "[[0],[0],[[\"foobar\"]]]";
  auto returnedCalls = parseMethodCalls(jsText);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(MethodArgument::Type::String, returnedCall.arguments[0].type);
  ASSERT_EQ("foobar", returnedCall.arguments[0].string);
}

TEST(parseMethodCalls, StringReturn) {
  auto jsText = "[[0],[0],[[42.16]]]";
  auto returnedCalls = parseMethodCalls(jsText);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(MethodArgument::Type::Number, returnedCall.arguments[0].type);
  ASSERT_EQ(42.16, returnedCall.arguments[0].number);
}

TEST(parseMethodCalls, BooleanReturn) {
  auto jsText = "[[0],[0],[[false]]]";
  auto returnedCalls = parseMethodCalls(jsText);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(MethodArgument::Type::Boolean, returnedCall.arguments[0].type);
  ASSERT_FALSE(returnedCall.arguments[0].boolean);
}

TEST(parseMethodCalls, NullReturn) {
  auto jsText = "[[0],[0],[[null]]]";
  auto returnedCalls = parseMethodCalls(jsText);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(MethodArgument::Type::Null, returnedCall.arguments[0].type);
}

TEST(parseMethodCalls, MapReturn) {
  auto jsText = "[[0],[0],[[{\"foo\": \"hello\", \"bar\": 4.0, \"baz\": true}]]]";
  auto returnedCalls = parseMethodCalls(jsText);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(MethodArgument::Type::Map, returnedCall.arguments[0].type);
  auto& returnedMap = returnedCall.arguments[0].map;
  auto fooIter = returnedMap.find("foo");
  ASSERT_NE(returnedMap.end(), fooIter);
  EXPECT_EQ(MethodArgument("hello"), fooIter->second);
  auto barIter = returnedMap.find("bar");
  ASSERT_NE(returnedMap.end(), barIter);
  EXPECT_EQ(MethodArgument(4.0), barIter->second);
  auto bazIter = returnedMap.find("baz");
  ASSERT_NE(returnedMap.end(), bazIter);
  EXPECT_EQ(MethodArgument(true), bazIter->second);
}

TEST(parseMethodCalls, ArrayReturn) {
  auto jsText = "[[0],[0],[[[\"foo\", 42.0, false]]]]";
  auto returnedCalls = parseMethodCalls(jsText);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(MethodArgument::Type::Array, returnedCall.arguments[0].type);
  auto& returnedArray = returnedCall.arguments[0].array;
  ASSERT_EQ(3, returnedArray.size());
  ASSERT_EQ(MethodArgument("foo"), returnedArray[0]);
  ASSERT_EQ(MethodArgument(42.0), returnedArray[1]);
  ASSERT_EQ(MethodArgument(false), returnedArray[2]);
}

TEST(parseMethodCalls, ReturnMultipleParams) {
  auto jsText = "[[0],[0],[[\"foo\", 14, null, false]]]";
  auto returnedCalls = parseMethodCalls(jsText);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(4, returnedCall.arguments.size());
  ASSERT_EQ(MethodArgument::Type::String, returnedCall.arguments[0].type);
  ASSERT_EQ(MethodArgument::Type::Number, returnedCall.arguments[1].type);
  ASSERT_EQ(MethodArgument::Type::Null, returnedCall.arguments[2].type);
  ASSERT_EQ(MethodArgument::Type::Boolean, returnedCall.arguments[3].type);
}

TEST(parseMethodCalls, ParseTwoCalls) {
  auto jsText = "[[0,0],[1,1],[[],[]]]";
  auto returnedCalls = parseMethodCalls(jsText);
  ASSERT_EQ(2, returnedCalls.size());
}

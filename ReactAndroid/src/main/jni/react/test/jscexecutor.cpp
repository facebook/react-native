// Copyright 2004-present Facebook. All Rights Reserved.

#include <gtest/gtest.h>
#include <react/JSCExecutor.h>

using namespace facebook;
using namespace facebook::react;

TEST(JSCExecutor, Initialize) {
  JSCExecutor executor;
}

TEST(JSCExecutor, Two) {
  JSCExecutor exec1;
  JSCExecutor exec2;
}

static std::vector<MethodCall> executeForMethodCalls(
    JSCExecutor& e,
    int moduleId,
    int methodId,
    std::vector<MethodArgument> args = std::vector<MethodArgument>()) {
  return parseMethodCalls(e.callFunction(moduleId, methodId, std::move(args)));
}

TEST(JSCExecutor, CallFunction) {
  auto jsText = ""
  "var Bridge = {"
  "  callFunctionReturnFlushedQueue: function (module, method, args) {"
  "    return [[module + 1], [method + 1], [args]];"
  "  },"
  "};"
  "function require() { return Bridge; }"
  "";
  JSCExecutor e;
  e.loadApplicationScript(jsText, "");
  std::vector<MethodArgument> args;
  args.emplace_back(true);
  args.emplace_back(0.4);
  args.emplace_back("hello, world");
  args.emplace_back(4.0);
  auto returnedCalls = executeForMethodCalls(e, 10, 9, args);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  EXPECT_EQ(11, returnedCall.moduleId);
  EXPECT_EQ(10, returnedCall.methodId);
  ASSERT_EQ(4, returnedCall.arguments.size());
  EXPECT_EQ(args[0], returnedCall.arguments[0]);
  EXPECT_EQ(args[1], returnedCall.arguments[1]);
  EXPECT_EQ(args[2], returnedCall.arguments[2]);
  EXPECT_EQ(MethodArgument(4.0), returnedCall.arguments[3]);
}

TEST(JSCExecutor, CallFunctionWithMap) {
  auto jsText = ""
  "var Bridge = {"
  "  callFunctionReturnFlushedQueue: function (module, method, args) {"
  "    var s = args[0].foo + args[0].bar + args[0].baz;"
  "    return [[module], [method], [[s]]];"
  "  },"
  "};"
  "function require() { return Bridge; }"
  "";
  JSCExecutor e;
  e.loadApplicationScript(jsText, "");
  std::vector<MethodArgument> args;
  std::map<std::string, MethodArgument> map {
    { "foo", MethodArgument("hello") },
    { "bar", MethodArgument(4.0) },
    { "baz", MethodArgument(true) },
  };
  args.emplace_back(std::move(map));
  auto returnedCalls = executeForMethodCalls(e, 10, 9, args);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(MethodArgument::Type::String, returnedCall.arguments[0].type);
  EXPECT_EQ("hello4true", returnedCall.arguments[0].string);
}

TEST(JSCExecutor, CallFunctionReturningMap) {
  auto jsText = ""
  "var Bridge = {"
  "  callFunctionReturnFlushedQueue: function (module, method, args) {"
  "    var s = { foo: 4, bar: true };"
  "    return [[module], [method], [[s]]];"
  "  },"
  "};"
  "function require() { return Bridge; }"
  "";
  JSCExecutor e;
  e.loadApplicationScript(jsText, "");
  auto returnedCalls = executeForMethodCalls(e, 10, 9);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(MethodArgument::Type::Map, returnedCall.arguments[0].type);
  auto& returnedMap = returnedCall.arguments[0].map;
  auto fooIter = returnedMap.find("foo");
  ASSERT_NE(returnedMap.end(), fooIter);
  EXPECT_EQ(MethodArgument(4.0), fooIter->second);
  auto barIter = returnedMap.find("bar");
  ASSERT_NE(returnedMap.end(), barIter);
  EXPECT_EQ(MethodArgument(true), barIter->second);
}

TEST(JSCExecutor, CallFunctionWithArray) {
  auto jsText = ""
  "var Bridge = {"
  "  callFunctionReturnFlushedQueue: function (module, method, args) {"
  "    var s = args[0][0]+ args[0][1] + args[0][2] + args[0].length;"
  "    return [[module], [method], [[s]]];"
  "  },"
  "};"
  "function require() { return Bridge; }"
  "";
  JSCExecutor e;
  e.loadApplicationScript(jsText, "");
  std::vector<MethodArgument> args;
  std::vector<MethodArgument> array {
    MethodArgument("hello"),
    MethodArgument(4.0),
    MethodArgument(true),
  };
  args.emplace_back(std::move(array));
  auto returnedCalls = executeForMethodCalls(e, 10, 9, args);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(MethodArgument::Type::String, returnedCall.arguments[0].type);
  EXPECT_EQ("hello4true3", returnedCall.arguments[0].string);
}

TEST(JSCExecutor, CallFunctionReturningNumberArray) {
  auto jsText = ""
  "var Bridge = {"
  "  callFunctionReturnFlushedQueue: function (module, method, args) {"
  "    var s = [3, 1, 4];"
  "    return [[module], [method], [[s]]];"
  "  },"
  "};"
  "function require() { return Bridge; }"
  "";
  JSCExecutor e;
  e.loadApplicationScript(jsText, "");
  auto returnedCalls = executeForMethodCalls(e, 10, 9);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(MethodArgument::Type::Array, returnedCall.arguments[0].type);

  auto& array = returnedCall.arguments[0].array;
  EXPECT_EQ(3, array.size());
  EXPECT_EQ(MethodArgument(3.0), array[0]);
  EXPECT_EQ(MethodArgument(4.0), array[2]);
}

TEST(JSCExecutor, SetSimpleGlobalVariable) {
  auto jsText = ""
  "var Bridge = {"
  "  callFunctionReturnFlushedQueue: function (module, method, args) {"
  "    return [[module], [method], [[__foo]]];"
  "  },"
  "};"
  "function require() { return Bridge; }"
  "";
  JSCExecutor e;
  e.loadApplicationScript(jsText, "");
  e.setGlobalVariable("__foo", "42");
  auto returnedCalls = executeForMethodCalls(e, 10, 9);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(MethodArgument::Type::Number, returnedCall.arguments[0].type);
  ASSERT_EQ(MethodArgument(42.0), returnedCall.arguments[0]);
}

TEST(JSCExecutor, SetObjectGlobalVariable) {
  auto jsText = ""
  "var Bridge = {"
  "  callFunctionReturnFlushedQueue: function (module, method, args) {"
  "    return [[module], [method], [[__foo]]];"
  "  },"
  "};"
  "function require() { return Bridge; }"
  "";
  JSCExecutor e;
  e.loadApplicationScript(jsText, "");
  auto jsonObject = ""
  "{"
  "  \"foo\": \"hello\","
  "  \"bar\": 4,"
  "  \"baz\": true"
  "}"
  "";
  e.setGlobalVariable("__foo", jsonObject);
  auto returnedCalls = executeForMethodCalls(e, 10, 9);
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

int main(int argc, char **argv) {
  testing::InitGoogleTest(&argc, argv);

  return RUN_ALL_TESTS();
}


// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include <gtest/gtest.h>
#include <cxxreact/JSCExecutor.h>
#include <cxxreact/MessageQueueThread.h>
#include <cxxreact/MethodCall.h>

using namespace facebook;
using namespace facebook::react;


// TODO(12340362): Fix these tests. And add checks for sizes.
/*

namespace {

std::string capturedMethodCalls;

struct NullDelegate : ExecutorDelegate {
  virtual void registerExecutor(std::unique_ptr<JSExecutor> executor,
                                std::shared_ptr<MessageQueueThread> queue) {
    std::terminate();
  }

  virtual std::unique_ptr<JSExecutor> unregisterExecutor(JSExecutor& executor) {
    std::terminate();
  }

  virtual std::vector<std::string> moduleNames() {
    return std::vector<std::string>{};
  }

  virtual folly::dynamic getModuleConfig(const std::string& name) {
    std::terminate();
  }
  virtual void callNativeModules(
      JSExecutor& executor, std::string callJSON, bool isEndOfBatch) {
    // TODO: capture calljson
    std::terminate();
  }
  virtual MethodCallResult callSerializableNativeHook(
      JSExecutor& executor, unsigned int moduleId, unsigned int methodId, folly::dynamic&& args) {
    std::terminate();
  }
};

struct FakeMessageQueue : MessageQueueThread {
  virtual void runOnQueue(std::function<void()>&& runnable) {
    // This is wrong, but oh well.
    runnable();
  }

  virtual void runOnQueueSync(std::function<void()>&& runnable) {
    runnable();
  }

  virtual void quitSynchronous() {
    std::terminate();
  }
};

std::vector<MethodCall> executeForMethodCalls(
    JSCExecutor& e,
    int moduleId,
    int methodId,
    folly::dynamic args = folly::dynamic::array()) {
  e.callFunction(folly::to<std::string>(moduleId), folly::to<std::string>(methodId), std::move(args));
  return parseMethodCalls(capturedMethodCalls);
}

void loadApplicationScript(JSCExecutor& e, std::string jsText) {
  e.loadApplicationScript(std::unique_ptr<JSBigString>(new JSBigStdString(jsText)), "");
}

void setGlobalVariable(JSCExecutor& e, std::string name, std::string jsonObject) {
  e.setGlobalVariable(name, std::unique_ptr<JSBigString>(new JSBigStdString(jsonObject)));
}

}

TEST(JSCExecutor, Initialize) {
  JSCExecutor executor(std::make_shared<NullDelegate>(), std::make_shared<FakeMessageQueue>(), "", folly::dynamic::object);
}

TEST(JSCExecutor, Two) {
  JSCExecutor exec1(std::make_shared<NullDelegate>(), std::make_shared<FakeMessageQueue>(), "", folly::dynamic::object);
  JSCExecutor exec2(std::make_shared<NullDelegate>(), std::make_shared<FakeMessageQueue>(), "", folly::dynamic::object);
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
  JSCExecutor e(std::make_shared<NullDelegate>(), std::make_shared<FakeMessageQueue>(), "", folly::dynamic::object);
  loadApplicationScript(e, jsText);
  folly::dynamic args = folly::dynamic::array();
  args.push_back(true);
  args.push_back(0.4);
  args.push_back("hello, world");
  args.push_back(4.0);
  auto returnedCalls = executeForMethodCalls(e, 10, 9, args);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  EXPECT_EQ(11, returnedCall.moduleId);
  EXPECT_EQ(10, returnedCall.methodId);
  ASSERT_EQ(4, returnedCall.arguments.size());
  EXPECT_EQ(args[0], returnedCall.arguments[0]);
  EXPECT_EQ(args[1], returnedCall.arguments[1]);
  EXPECT_EQ(args[2], returnedCall.arguments[2]);
  EXPECT_EQ(folly::dynamic(4.0), returnedCall.arguments[3]);
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
  JSCExecutor e(std::make_shared<NullDelegate>(), std::make_shared<FakeMessageQueue>(), "", folly::dynamic::object);
  loadApplicationScript(e, jsText);
  folly::dynamic args = folly::dynamic::array();
  folly::dynamic map = folly::dynamic::object
    ("foo", folly::dynamic("hello"))
    ("bar", folly::dynamic(4.0))
    ("baz", folly::dynamic(true))
  ;
  args.push_back(std::move(map));
  auto returnedCalls = executeForMethodCalls(e, 10, 9, args);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  EXPECT_EQ("hello4true", returnedCall.arguments[0].getString());
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
  JSCExecutor e(std::make_shared<NullDelegate>(), std::make_shared<FakeMessageQueue>(), "", folly::dynamic::object);
  loadApplicationScript(e, jsText);
  auto returnedCalls = executeForMethodCalls(e, 10, 9);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(folly::dynamic::OBJECT, returnedCall.arguments[0].type());
  auto& returnedMap = returnedCall.arguments[0];
  auto foo = returnedMap.at("foo");
  EXPECT_EQ(folly::dynamic(4.0), foo);
  auto bar = returnedMap.at("bar");
  EXPECT_EQ(folly::dynamic(true), bar);
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
  JSCExecutor e(std::make_shared<NullDelegate>(), std::make_shared<FakeMessageQueue>(), "", folly::dynamic::object);
  loadApplicationScript(e, jsText);
  std::vector<folly::dynamic> args;
  std::vector<folly::dynamic> array {
    folly::dynamic("hello"),
    folly::dynamic(4.0),
    folly::dynamic(true),
  };
  args.push_back(std::move(array));
  auto returnedCalls = executeForMethodCalls(e, 10, 9, args);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  EXPECT_EQ("hello4true3", returnedCall.arguments[0].getString());
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
  JSCExecutor e(std::make_shared<NullDelegate>(), std::make_shared<FakeMessageQueue>(), "", folly::dynamic::object);
  loadApplicationScript(e, jsText);
  auto returnedCalls = executeForMethodCalls(e, 10, 9);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(folly::dynamic::ARRAY, returnedCall.arguments[0].type());

  auto& array = returnedCall.arguments[0];
  EXPECT_EQ(3, array.size());
  EXPECT_EQ(folly::dynamic(3.0), array[0]);
  EXPECT_EQ(folly::dynamic(4.0), array[2]);
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
  JSCExecutor e(std::make_shared<NullDelegate>(), std::make_shared<FakeMessageQueue>(), "", folly::dynamic::object);
  loadApplicationScript(e, jsText);
  setGlobalVariable(e, "__foo", "42");
  auto returnedCalls = executeForMethodCalls(e, 10, 9);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(42.0, returnedCall.arguments[0].getDouble());
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
  JSCExecutor e(std::make_shared<NullDelegate>(), std::make_shared<FakeMessageQueue>(), "", folly::dynamic::object);
  loadApplicationScript(e, jsText);
  auto jsonObject = ""
  "{"
  "  \"foo\": \"hello\","
  "  \"bar\": 4,"
  "  \"baz\": true"
  "}"
  "";
  setGlobalVariable(e, "__foo", jsonObject);
  auto returnedCalls = executeForMethodCalls(e, 10, 9);
  ASSERT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  ASSERT_EQ(1, returnedCall.arguments.size());
  ASSERT_EQ(folly::dynamic::OBJECT, returnedCall.arguments[0].type());
  auto& returnedMap = returnedCall.arguments[0];
  auto foo = returnedMap.at("foo");
  EXPECT_EQ(folly::dynamic("hello"), foo);
  auto bar = returnedMap.at("bar");
  EXPECT_EQ(folly::dynamic(4.0), bar);
  auto baz = returnedMap.at("baz");
  EXPECT_EQ(folly::dynamic(true), baz);
}

*/

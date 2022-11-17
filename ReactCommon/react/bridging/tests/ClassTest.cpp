/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BridgingTest.h"

namespace facebook::react {

using namespace std::literals;

struct TestClass {
  TestClass(std::shared_ptr<CallInvoker> invoker) : invoker_(invoker) {}

  double add(jsi::Runtime &, int a, float b) {
    return a + b;
  }

  jsi::Object getObject(jsi::Runtime &, jsi::Object obj) {
    return obj;
  }

  AsyncPromise<std::string> getPromise(jsi::Runtime &rt, std::string result) {
    auto promise = AsyncPromise<std::string>(rt, invoker_);
    promise.resolve(result);
    return promise;
  }

  std::string
  callFunc(jsi::Runtime &, SyncCallback<std::string(int)> func, int num) {
    return func(num);
  }

  void callAsync(jsi::Runtime &, AsyncCallback<> callback) {
    callback();
  }

 private:
  std::shared_ptr<CallInvoker> invoker_;
};

TEST_F(BridgingTest, callFromJsTest) {
  auto instance = TestClass(invoker);

  EXPECT_EQ(
      3.0,
      bridging::callFromJs<double>(
          rt, &TestClass::add, invoker, &instance, 1, 2.0));

  auto object = jsi::Object(rt);

  EXPECT_TRUE(jsi::Object::strictEquals(
      rt,
      object,
      bridging::callFromJs<jsi::Object>(
          rt, &TestClass::getObject, invoker, &instance, object)));

  auto promise = bridging::callFromJs<jsi::Object>(
      rt,
      &TestClass::getPromise,
      invoker,
      &instance,
      jsi::String::createFromAscii(rt, "hi"));
  auto then = promise.getPropertyAsFunction(rt, "then");

  std::string result;
  then.callWithThis(
      rt,
      promise,
      bridging::toJs(
          rt, [&](std::string res) { result = res; }, invoker));

  flushQueue();
  EXPECT_EQ("hi"s, result);

  auto func = function("(num) => String(num)");

  EXPECT_EQ(
      "1"s,
      bridging::callFromJs<jsi::String>(
          rt, &TestClass::callFunc, invoker, &instance, func, 1)
          .utf8(rt));

  bool called = false;
  func = bridging::toJs(
      rt, [&] { called = true; }, invoker);

  bridging::callFromJs<void>(
      rt, &TestClass::callAsync, invoker, &instance, func);

  flushQueue();
  EXPECT_TRUE(called);
}

} // namespace facebook::react

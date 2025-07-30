/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/TestCallInvoker.h>
#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/bridging/Bridging.h>
#include <react/debug/react_native_assert.h>
#include <memory>
#include <optional>

namespace facebook::react {

template <typename T, typename... Args>
class TurboModuleTestFixture : public ::testing::Test {
 public:
  explicit TurboModuleTestFixture(Args... args)
      : runtime_(facebook::hermes::makeHermesRuntime()),
        jsInvoker_(std::make_shared<TestCallInvoker>(runtime_)),
        module_(std::make_shared<T>(jsInvoker_, std::forward<Args>(args)...)) {}

  void SetUp() override {
    auto setImmediateName =
        jsi::PropNameID::forAscii(*runtime_, "setImmediate");
    runtime_->global().setProperty(
        *runtime_,
        setImmediateName,
        jsi::Function::createFromHostFunction(
            *runtime_,
            setImmediateName,
            1,
            [jsInvoker = jsInvoker_](
                jsi::Runtime& rt,
                [[maybe_unused]] const jsi::Value& thisVal,
                const jsi::Value* args,
                size_t count) {
              react_native_assert(count >= 1);
              jsInvoker->invokeAsync([cb = std::make_shared<jsi::Value>(
                                          rt, args[0])](jsi::Runtime& rt) {
                cb->asObject(rt).asFunction(rt).call(rt);
              });
              return jsi::Value::undefined();
            }));
  }

  void TearDown() override {
    module_ = nullptr;
    jsInvoker_ = nullptr;
    runtime_ = nullptr;
  }

  template <typename TPromise>
  std::optional<TPromise> resolvePromise(
      const AsyncPromise<TPromise>& asyncPromise) {
    auto promise = asyncPromise.get(*runtime_);
    std::optional<TPromise> result = std::nullopt;
    promise.getPropertyAsFunction(*runtime_, "then")
        .callWithThis(
            *runtime_,
            promise,
            bridging::toJs(
                *runtime_,
                [&](TPromise value) { result = std::move(value); },
                jsInvoker_));
    jsInvoker_->flushQueue();
    return result;
  }

  template <typename TPromise>
  std::optional<std::string> handleError(
      const AsyncPromise<TPromise>& asyncPromise) {
    auto promise = asyncPromise.get(*runtime_);
    std::optional<std::string> message;
    promise.getPropertyAsFunction(*runtime_, "catch")
        .callWithThis(
            *runtime_,
            promise,
            bridging::toJs(
                *runtime_,
                [&](jsi::Object error) {
                  message = bridging::fromJs<std::string>(
                      *runtime_,
                      error.getProperty(*runtime_, "message"),
                      jsInvoker_);
                },
                jsInvoker_));
    jsInvoker_->flushQueue();
    return message;
  }

 protected:
  std::shared_ptr<jsi::Runtime> runtime_{};
  std::shared_ptr<TestCallInvoker> jsInvoker_{};
  std::shared_ptr<T> module_;
};

} // namespace facebook::react

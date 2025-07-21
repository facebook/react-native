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
#include <memory>

namespace facebook::react {

template <typename T, typename... Args>
class TurboModuleTestFixture : public ::testing::Test {
 public:
  explicit TurboModuleTestFixture(Args... args)
      : runtime_(facebook::hermes::makeHermesRuntime()),
        jsInvoker_(std::make_shared<TestCallInvoker>(runtime_)),
        module_(std::make_shared<T>(jsInvoker_, std::forward<Args>(args)...)) {}

 protected:
  std::shared_ptr<jsi::Runtime> runtime_{};
  std::shared_ptr<TestCallInvoker> jsInvoker_{};
  std::shared_ptr<T> module_;
};

} // namespace facebook::react

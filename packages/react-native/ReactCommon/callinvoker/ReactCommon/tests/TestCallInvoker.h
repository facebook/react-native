/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include <list>
#include <memory>

namespace facebook::react {

class TestCallInvoker : public CallInvoker {
 public:
  explicit TestCallInvoker(std::shared_ptr<facebook::jsi::Runtime> runtime)
      : runtime_(runtime) {}

  void invokeAsync(CallFunc&& func) noexcept override {
    queue_.push_back(std::move(func));
  }

  void invokeSync(CallFunc&& func) override {
    if (auto runtime = runtime_.lock()) {
      func(*runtime);
    }
  }

  void flushQueue() {
    if (auto runtime = runtime_.lock()) {
      while (!queue_.empty()) {
        queue_.front()(*runtime);
        queue_.pop_front();
        runtime->drainMicrotasks(); // Run microtasks every cycle.
      }
    }
  }

 private:
  std::list<CallFunc> queue_{};
  std::weak_ptr<facebook::jsi::Runtime> runtime_{};
};

} // namespace facebook::react

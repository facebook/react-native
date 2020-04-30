/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SerialExecutor.h"

#include <pthread.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace detail {

SerialExecutor::SerialExecutor(const std::string &name)
    : finish_(false), thread_(name, [this]() { runLoop(); }) {}

SerialExecutor::~SerialExecutor() {
  {
    std::lock_guard<std::mutex> lock(mutex_);
    finish_ = true;
    wakeup_.notify_one();
  }

  thread_.join();
}

void SerialExecutor::add(folly::Func func) {
  std::lock_guard<std::mutex> lock(mutex_);
  funcs_.push(std::move(func));
  wakeup_.notify_one();
}

void SerialExecutor::runLoop() {
  bool shouldExit = false;
  while (!shouldExit) {
    folly::Func func;

    {
      std::unique_lock<std::mutex> lock(mutex_);
      wakeup_.wait(lock, [this] { return finish_ || !funcs_.empty(); });

      if (!funcs_.empty()) {
        func = std::move(funcs_.front());
        funcs_.pop();
      }

      shouldExit = funcs_.empty() && finish_;
    }

    if (func) {
      func();
    }
  }
}

} // namespace detail
} // namespace inspector
} // namespace hermes
} // namespace facebook

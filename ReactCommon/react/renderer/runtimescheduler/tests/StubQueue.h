/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <queue>

class StubQueue {
 public:
  void runOnQueue(std::function<void()> &&func) {
    callbackQueue_.push(func);
  }

  void flush() {
    while (!callbackQueue_.empty()) {
      tick();
    }
  }

  void tick() {
    if (!callbackQueue_.empty()) {
      auto callback = callbackQueue_.front();
      callback();
      callbackQueue_.pop();
    }
  }

  int size() {
    return callbackQueue_.size();
  }

 private:
  std::queue<std::function<void()>> callbackQueue_;
};

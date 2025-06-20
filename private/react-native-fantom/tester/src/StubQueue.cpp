// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#include "StubQueue.h"

namespace facebook::react {

void StubQueue::runOnQueue(std::function<void()>&& func) {
  callbackQueue_.push(func);
}

void StubQueue::runOnQueueSync(std::function<void()>&& runnable) {
  flush();
  runnable();
}

void StubQueue::quitSynchronous() {
  flush();
}

void StubQueue::flush() {
  while (!callbackQueue_.empty()) {
    tick();
  }
}

bool StubQueue::hasPendingCallbacks() {
  return !callbackQueue_.empty();
}

void StubQueue::tick() {
  if (!callbackQueue_.empty()) {
    auto callback = callbackQueue_.front();
    callbackQueue_.pop();
    if (callback) {
      callback();
    }
  }
}

} // namespace facebook::react

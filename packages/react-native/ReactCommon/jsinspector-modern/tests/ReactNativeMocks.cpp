/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactNativeMocks.h"
#include <glog/logging.h>

namespace facebook::react::jsinspector_modern {

//
// MockMessageQueueThread
//

void MockMessageQueueThread::runOnQueue(std::function<void()>&& func) {
  callbackQueue_.push(func);
}

void MockMessageQueueThread::tick() {
  if (!callbackQueue_.empty()) {
    auto callback = callbackQueue_.front();
    callback();
    callbackQueue_.pop();
  }
}

void MockMessageQueueThread::guardedTick() {
  try {
    tick();
  } catch (const std::exception& e) {
    // For easier debugging
    FAIL() << e.what();
  }
}

void MockMessageQueueThread::flush() {
  while (!callbackQueue_.empty()) {
    tick();
  }
}

size_t MockMessageQueueThread::size() {
  return callbackQueue_.size();
}

void MockMessageQueueThread::quitSynchronous() {
  assert(false && "Not implemented");
}
void MockMessageQueueThread::runOnQueueSync(std::function<void()>&& callback) {
  callback();
}

//
// ErrorUtils
//
jsi::Value ErrorUtils::get(jsi::Runtime& rt, const jsi::PropNameID& name) {
  auto methodName = name.utf8(rt);

  if (methodName == "reportFatalError") {
    return jsi::Function::createFromHostFunction(
        rt,
        name,
        1,
        [this](
            jsi::Runtime& runtime,
            /* thisValue */ const jsi::Value&,
            const jsi::Value* arguments,
            size_t count) {
          if (count >= 1) {
            auto value = jsi::Value(runtime, arguments[0]);
            auto error = jsi::JSError(runtime, std::move(value));
            LOG(INFO) << "JSI Fatal: " << error.getMessage();
            reportFatalError(std::move(error));
          }
          return jsi::Value::undefined();
        });
  } else {
    throw std::runtime_error("Unknown method: " + methodName);
  }
}

size_t ErrorUtils::size() {
  return errors_.size();
}

jsi::JSError ErrorUtils::getLastError() {
  auto error = errors_.back();
  errors_.pop_back();
  return error;
}

} // namespace facebook::react::jsinspector_modern

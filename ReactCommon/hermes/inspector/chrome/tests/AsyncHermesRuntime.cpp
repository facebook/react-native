// Copyright 2004-present Facebook. All Rights Reserved.

#include "AsyncHermesRuntime.h"

#include <functional>
#include <stdexcept>
#include <thread>

#include <glog/logging.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

namespace detail = facebook::hermes::inspector::detail;

AsyncHermesRuntime::AsyncHermesRuntime()
    : runtime_(facebook::hermes::makeHermesRuntime()),
      executor_(
          std::make_unique<detail::SerialExecutor>("async-hermes-runtime")) {
  using namespace std::placeholders;

  runtime_->global().setProperty(
      *runtime_,
      "shouldStop",
      jsi::Function::createFromHostFunction(
          *runtime_,
          jsi::PropNameID::forAscii(*runtime_, "shouldStop"),
          0,
          std::bind(&AsyncHermesRuntime::shouldStop, this, _1, _2, _3, _4)));

  runtime_->global().setProperty(
      *runtime_,
      "storeValue",
      jsi::Function::createFromHostFunction(
          *runtime_,
          jsi::PropNameID::forAscii(*runtime_, "storeValue"),
          0,
          std::bind(&AsyncHermesRuntime::storeValue, this, _1, _2, _3, _4)));
}

AsyncHermesRuntime::~AsyncHermesRuntime() {
  stop();
  wait();
}

void AsyncHermesRuntime::executeScriptAsync(
    const std::string &script,
    const std::string &url,
    HermesRuntime::DebugFlags flags) {
  int scriptId = rand();
  LOG(INFO) << "AsyncHermesRuntime will execute script with id: " << scriptId
            << ", contents: " << script;

  executor_->add([this, script, url, flags, scriptId] {
    LOG(INFO) << "AsyncHermesRuntime executing script id " << scriptId
              << " in background";

    try {
      runtime_->debugJavaScript(script, url, flags);
    } catch (jsi::JSError &error) {
      LOG(INFO) << "AsyncHermesRuntime JSError " << error.getMessage();
      thrownExceptions_.push_back(error.getMessage());
    }

    LOG(INFO) << "AsyncHermesRuntime finished executing script id " << scriptId;
  });
}

void AsyncHermesRuntime::start() {
  LOG(INFO) << "AsyncHermesRuntime: set stop flag false";
  stopFlag_.store(false);
}

void AsyncHermesRuntime::stop() {
  LOG(INFO) << "AsyncHermesRuntime: set stop flag true";
  stopFlag_.store(true);
}

folly::Future<jsi::Value> AsyncHermesRuntime::getStoredValue() {
  return storedValue_.getFuture();
}

jsi::Value AsyncHermesRuntime::awaitStoredValue(
    std::chrono::milliseconds timeout) {
  return getStoredValue().get(timeout);
}

void AsyncHermesRuntime::wait(std::chrono::milliseconds timeout) {
  LOG(INFO) << "AsyncHermesRuntime wait requested";
  auto promise = std::make_shared<folly::Promise<bool>>();
  auto future = promise->getFuture();
  executor_->add([promise] {
    LOG(INFO) << "AsyncHermesRuntime wait resolved";
    promise->setValue(true);
  });
  std::move(future).get(timeout);
}

jsi::Value AsyncHermesRuntime::shouldStop(
    jsi::Runtime &runtime,
    const jsi::Value &thisVal,
    const jsi::Value *args,
    size_t count) {
  return stopFlag_.load() ? jsi::Value(true) : jsi::Value(false);
}

jsi::Value AsyncHermesRuntime::storeValue(
    jsi::Runtime &runtime,
    const jsi::Value &thisVal,
    const jsi::Value *args,
    size_t count) {
  if (count > 0) {
    storedValue_.setValue(jsi::Value(runtime, args[0]));
  }
  return jsi::Value();
}

size_t AsyncHermesRuntime::getNumberOfExceptions() {
  return thrownExceptions_.size();
}

std::string AsyncHermesRuntime::getLastThrownExceptionMessage() {
  return thrownExceptions_.back();
}

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook

// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#include "BridgelessJSCallInvoker.h"

#include <exception>
#include <utility>

namespace facebook {
namespace react {

BridgelessJSCallInvoker::BridgelessJSCallInvoker(
    RuntimeExecutor runtimeExecutor)
    : runtimeExecutor_(std::move(runtimeExecutor)) {}

void BridgelessJSCallInvoker::invokeAsync(std::function<void()> &&func) {
  runtimeExecutor_([func = std::move(func)](jsi::Runtime &runtime) { func(); });
}

void BridgelessJSCallInvoker::invokeSync(std::function<void()> &&func) {
  // TODO: Replace JS Callinvoker with RuntimeExecutor.
  throw std::runtime_error(
      "Synchronous native -> JS calls are currently not supported.");
}

} // namespace react
} // namespace facebook

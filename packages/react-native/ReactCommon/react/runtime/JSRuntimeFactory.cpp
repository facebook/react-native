/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSRuntimeFactory.h"

namespace facebook::react {

jsi::Runtime& JSIRuntimeHolder::getRuntime() noexcept {
  return *runtime_;
}

JSIRuntimeHolder::JSIRuntimeHolder(std::unique_ptr<jsi::Runtime> runtime)
    : runtime_(std::move(runtime)) {
  assert(runtime_ != nullptr);
}

jsinspector_modern::RuntimeTargetDelegate&
JSRuntime::getRuntimeTargetDelegate() {
  if (!runtimeTargetDelegate_) {
    runtimeTargetDelegate_.emplace(getRuntime().description());
  }
  return *runtimeTargetDelegate_;
}

} // namespace facebook::react

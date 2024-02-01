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

std::unique_ptr<jsinspector_modern::RuntimeAgent>
JSIRuntimeHolder::createInspectorAgent(
    jsinspector_modern::FrontendChannel frontendChannel,
    jsinspector_modern::SessionState& sessionState) {
  return std::make_unique<jsinspector_modern::FallbackRuntimeAgent>(
      std::move(frontendChannel), sessionState, runtime_->description());
}

} // namespace facebook::react

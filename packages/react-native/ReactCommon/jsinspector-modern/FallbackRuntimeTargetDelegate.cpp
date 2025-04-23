/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FallbackRuntimeTargetDelegate.h"
#include "FallbackRuntimeAgentDelegate.h"

namespace facebook::react::jsinspector_modern {

FallbackRuntimeTargetDelegate::FallbackRuntimeTargetDelegate(
    std::string engineDescription)
    : engineDescription_{std::move(engineDescription)} {}

std::unique_ptr<RuntimeAgentDelegate>
FallbackRuntimeTargetDelegate::createAgentDelegate(
    FrontendChannel channel,
    SessionState& sessionState,
    std::unique_ptr<RuntimeAgentDelegate::ExportedState>
    /*previouslyExportedState*/,
    const ExecutionContextDescription& /*executionContextDescription*/,
    RuntimeExecutor /*runtimeExecutor*/) {
  return std::make_unique<jsinspector_modern::FallbackRuntimeAgentDelegate>(
      std::move(channel), sessionState, engineDescription_);
}

void FallbackRuntimeTargetDelegate::addConsoleMessage(
    jsi::Runtime& /*unused*/,
    ConsoleMessage /*unused*/) {
  // TODO: Best-effort printing (without RemoteObjects)
}

bool FallbackRuntimeTargetDelegate::supportsConsole() const {
  return false;
}

std::unique_ptr<StackTrace> FallbackRuntimeTargetDelegate::captureStackTrace(
    jsi::Runtime& /*runtime*/,
    size_t /*framesToSkip*/
) {
  // TODO: Parse a JS `Error().stack` as a fallback
  return std::make_unique<StackTrace>();
}

void FallbackRuntimeTargetDelegate::enableSamplingProfiler() {
  // no-op
};

void FallbackRuntimeTargetDelegate::disableSamplingProfiler() {
  // no-op
};

tracing::RuntimeSamplingProfile
FallbackRuntimeTargetDelegate::collectSamplingProfile() {
  throw std::logic_error(
      "Sampling Profiler capabilities are not supported for Runtime fallback");
}

} // namespace facebook::react::jsinspector_modern

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ConsoleTaskContext.h"
#include "ConsoleTaskOrchestrator.h"
#include "RuntimeTarget.h"

namespace facebook::react::jsinspector_modern {

ConsoleTaskContext::ConsoleTaskContext(
    jsi::Runtime& runtime,
    RuntimeTargetDelegate& runtimeTargetDelegate,
    std::string name)
    : runtimeTargetDelegate_(runtimeTargetDelegate),
      name_(std::move(name)),
      orchestrator_(ConsoleTaskOrchestrator::getInstance()) {
  stackTrace_ = runtimeTargetDelegate_.captureStackTrace(runtime);
}

ConsoleTaskContext::~ConsoleTaskContext() {
  orchestrator_.cancelTask(id());
}

ConsoleTaskId ConsoleTaskContext::id() const {
  return ConsoleTaskId{(void*)this};
}

std::optional<folly::dynamic> ConsoleTaskContext::getSerializedStackTrace()
    const {
  auto maybeValue = runtimeTargetDelegate_.serializeStackTrace(*stackTrace_);
  if (maybeValue) {
    maybeValue.value()["description"] = name_;
  }

  return maybeValue;
}

void ConsoleTaskContext::schedule() {
  orchestrator_.scheduleTask(id(), weak_from_this());
}

} // namespace facebook::react::jsinspector_modern

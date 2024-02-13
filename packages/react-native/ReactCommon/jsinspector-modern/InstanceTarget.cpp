/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InstanceAgent.h"
#include "SessionState.h"

#include <jsinspector-modern/InstanceTarget.h>

namespace facebook::react::jsinspector_modern {

InstanceTarget::InstanceTarget(InstanceTargetDelegate& delegate)
    : delegate_(delegate) {
  (void)delegate_;
}

InstanceTargetDelegate::~InstanceTargetDelegate() {}

std::shared_ptr<InstanceAgent> InstanceTarget::createAgent(
    FrontendChannel channel,
    SessionState& sessionState) {
  auto instanceAgent =
      std::make_shared<InstanceAgent>(channel, *this, sessionState);
  instanceAgent->setCurrentRuntime(
      currentRuntime_.has_value() ? &*currentRuntime_ : nullptr);
  agents_.push_back(instanceAgent);
  return instanceAgent;
}

RuntimeTarget& InstanceTarget::registerRuntime(
    RuntimeTargetDelegate& delegate) {
  assert(!currentRuntime_ && "Only one Runtime allowed");
  currentRuntime_.emplace(delegate);
  forEachAgent([currentRuntime = &*currentRuntime_](InstanceAgent& agent) {
    agent.setCurrentRuntime(currentRuntime);
  });
  return *currentRuntime_;
}

void InstanceTarget::unregisterRuntime(RuntimeTarget& Runtime) {
  assert(
      currentRuntime_.has_value() && &currentRuntime_.value() == &Runtime &&
      "Invalid unregistration");
  forEachAgent([](InstanceAgent& agent) { agent.setCurrentRuntime(nullptr); });
  currentRuntime_.reset();
}

} // namespace facebook::react::jsinspector_modern

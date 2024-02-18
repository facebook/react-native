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

std::shared_ptr<InstanceTarget> InstanceTarget::create(
    std::shared_ptr<ExecutionContextManager> executionContextManager,
    InstanceTargetDelegate& delegate,
    VoidExecutor executor) {
  std::shared_ptr<InstanceTarget> instanceTarget{
      new InstanceTarget(executionContextManager, delegate)};
  instanceTarget->setExecutor(executor);
  return instanceTarget;
}

InstanceTarget::InstanceTarget(
    std::shared_ptr<ExecutionContextManager> executionContextManager,
    InstanceTargetDelegate& delegate)
    : delegate_(delegate),
      executionContextManager_(std::move(executionContextManager)) {
  (void)delegate_;
}

InstanceTargetDelegate::~InstanceTargetDelegate() {}

std::shared_ptr<InstanceAgent> InstanceTarget::createAgent(
    FrontendChannel channel,
    SessionState& sessionState) {
  auto instanceAgent =
      std::make_shared<InstanceAgent>(channel, *this, sessionState);
  instanceAgent->setCurrentRuntime(currentRuntime_.get());
  agents_.insert(instanceAgent);
  return instanceAgent;
}

InstanceTarget::~InstanceTarget() {
  // Agents are owned by the session, not by InstanceTarget, but
  // they hold an InstanceTarget& that we must guarantee is valid.
  assert(
      agents_.empty() &&
      "InstanceAgent objects must be destroyed before their InstanceTarget. Did you call PageTarget::unregisterInstance()?");
}

RuntimeTarget& InstanceTarget::registerRuntime(
    RuntimeTargetDelegate& delegate,
    RuntimeExecutor jsExecutor) {
  assert(!currentRuntime_ && "Only one Runtime allowed");
  currentRuntime_ = RuntimeTarget::create(
      ExecutionContextDescription{
          .id = executionContextManager_->allocateExecutionContextId(),
          .origin = "",
          .name = "main",
          .uniqueId = std::nullopt},
      delegate,
      jsExecutor,
      makeVoidExecutor(executorFromThis()));

  agents_.forEach([currentRuntime = &*currentRuntime_](InstanceAgent& agent) {
    agent.setCurrentRuntime(currentRuntime);
  });
  return *currentRuntime_;
}

void InstanceTarget::unregisterRuntime(RuntimeTarget& Runtime) {
  assert(
      currentRuntime_ && currentRuntime_.get() == &Runtime &&
      "Invalid unregistration");
  agents_.forEach(
      [](InstanceAgent& agent) { agent.setCurrentRuntime(nullptr); });
  currentRuntime_.reset();
}

} // namespace facebook::react::jsinspector_modern

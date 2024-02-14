/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/RuntimeTarget.h>

namespace facebook::react::jsinspector_modern {

std::shared_ptr<RuntimeTarget> RuntimeTarget::create(
    RuntimeTargetDelegate& delegate,
    RuntimeExecutor jsExecutor,
    VoidExecutor selfExecutor) {
  std::shared_ptr<RuntimeTarget> runtimeTarget{
      new RuntimeTarget(delegate, jsExecutor)};
  runtimeTarget->setExecutor(selfExecutor);
  return runtimeTarget;
}

RuntimeTarget::RuntimeTarget(
    RuntimeTargetDelegate& delegate,
    RuntimeExecutor jsExecutor)
    : delegate_(delegate), jsExecutor_(jsExecutor) {}

std::shared_ptr<RuntimeAgent> RuntimeTarget::createAgent(
    FrontendChannel channel,
    SessionState& sessionState) {
  auto runtimeAgent = std::make_shared<RuntimeAgent>(
      channel,
      *this,
      sessionState,
      delegate_.createAgentDelegate(channel, sessionState));
  agents_.insert(runtimeAgent);
  return runtimeAgent;
}

RuntimeTarget::~RuntimeTarget() {
  // Agents are owned by the session, not by RuntimeTarget, but
  // they hold a RuntimeTarget& that we must guarantee is valid.
  assert(
      agents_.empty() &&
      "RuntimeAgent objects must be destroyed before their RuntimeTarget. Did you call InstanceTarget::unregisterRuntime()?");
}

} // namespace facebook::react::jsinspector_modern

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/RuntimeTarget.h>

namespace facebook::react::jsinspector_modern {
RuntimeTarget::RuntimeTarget(RuntimeTargetDelegate& delegate)
    : delegate_(delegate) {}

std::shared_ptr<RuntimeAgent> RuntimeTarget::createAgent(
    FrontendChannel channel,
    SessionState& sessionState) {
  auto runtimeAgent = std::make_shared<RuntimeAgent>(
      channel,
      *this,
      sessionState,
      delegate_.createAgentDelegate(channel, sessionState));
  agents_.push_back(runtimeAgent);
  return runtimeAgent;
}

void RuntimeTarget::removeExpiredAgents() {
  // Remove all expired agents.
  forEachAgent([](auto&) {});
}

RuntimeTarget::~RuntimeTarget() {
  removeExpiredAgents();

  // Agents are owned by the session, not by RuntimeTarget, but
  // they hold a RuntimeTarget& that we must guarantee is valid.
  assert(
      agents_.empty() &&
      "RuntimeAgent objects must be destroyed before their RuntimeTarget. Did you call InstanceTarget::unregisterRuntime()?");
}

} // namespace facebook::react::jsinspector_modern

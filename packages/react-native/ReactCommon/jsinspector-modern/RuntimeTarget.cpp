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

std::unique_ptr<RuntimeAgent> RuntimeTarget::createAgent(
    FrontendChannel channel,
    SessionState& sessionState) {
  return std::make_unique<RuntimeAgent>(
      channel,
      *this,
      sessionState,
      delegate_.createAgentDelegate(channel, sessionState));
}

} // namespace facebook::react::jsinspector_modern

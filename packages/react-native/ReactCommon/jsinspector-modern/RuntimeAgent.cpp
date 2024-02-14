/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeAgent.h"

namespace facebook::react::jsinspector_modern {

RuntimeAgent::RuntimeAgent(
    FrontendChannel frontendChannel,
    RuntimeTarget& target,
    SessionState& sessionState,
    std::unique_ptr<RuntimeAgentDelegate> delegate)
    : frontendChannel_(std::move(frontendChannel)),
      target_(target),
      sessionState_(sessionState),
      delegate_(std::move(delegate)) {
  (void)target_;
  (void)sessionState_;
}

bool RuntimeAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (delegate_) {
    return delegate_->handleRequest(req);
  }
  return false;
}

} // namespace facebook::react::jsinspector_modern

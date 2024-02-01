/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/InstanceAgent.h>

namespace facebook::react::jsinspector_modern {

InstanceAgent::InstanceAgent(
    FrontendChannel frontendChannel,
    InstanceTarget& target,
    std::unique_ptr<RuntimeAgent> runtimeAgent)
    : frontendChannel_(frontendChannel),
      target_(target),
      runtimeAgent_(std::move(runtimeAgent)) {
  (void)target_;
}

bool InstanceAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (runtimeAgent_ && runtimeAgent_->handleRequest(req)) {
    return true;
  }
  return false;
}

} // namespace facebook::react::jsinspector_modern

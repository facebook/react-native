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
    InstanceTarget& target)
    : frontendChannel_(frontendChannel), target_(target) {
  (void)target_;
}

bool InstanceAgent::handleRequest(const cdp::PreparsedRequest& req) {
  // NOTE: Our implementation of @cdp Runtime.getHeapUsage is a stub.
  if (req.method == "Runtime.getHeapUsage") {
    folly::dynamic res = folly::dynamic::object("id", req.id)(
        "result", folly::dynamic::object("usedSize", 0)("totalSize", 0));
    frontendChannel_(folly::toJson(res));
    return true;
  }
  return false;
}

int InstanceAgent::getExecutionContextId() const {
  return 1;
}

} // namespace facebook::react::jsinspector_modern

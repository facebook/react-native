/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/InstanceAgent.h>
#include "RuntimeTarget.h"

namespace facebook::react::jsinspector_modern {

InstanceAgent::InstanceAgent(
    FrontendChannel frontendChannel,
    InstanceTarget& target,
    SessionState& sessionState)
    : frontendChannel_(frontendChannel),
      target_(target),
      sessionState_(sessionState) {
  (void)target_;
}

bool InstanceAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (req.method == "Runtime.enable") {
    maybeSendExecutionContextCreatedNotification();
    // Fall through
  }
  if (runtimeAgent_ && runtimeAgent_->handleRequest(req)) {
    return true;
  }
  return false;
}

void InstanceAgent::setCurrentRuntime(RuntimeTarget* runtimeTarget) {
  auto previousRuntimeAgent = std::move(runtimeAgent_);
  if (runtimeTarget) {
    runtimeAgent_ = runtimeTarget->createAgent(frontendChannel_, sessionState_);
  } else {
    runtimeAgent_.reset();
  }
  if (!sessionState_.isRuntimeDomainEnabled) {
    return;
  }
  if (previousRuntimeAgent != nullptr) {
    auto& previousContext =
        previousRuntimeAgent->getExecutionContextDescription();
    folly::dynamic params =
        folly::dynamic::object("executionContextId", previousContext.id);
    if (previousContext.uniqueId.has_value()) {
      params["executionContextUniqueId"] = *previousContext.uniqueId;
    }
    folly::dynamic contextDestroyed = folly::dynamic::object(
        "method", "Runtime.executionContextDestroyed")("params", params);
    frontendChannel_(folly::toJson(contextDestroyed));
  }
  maybeSendExecutionContextCreatedNotification();
}

void InstanceAgent::maybeSendExecutionContextCreatedNotification() {
  if (runtimeAgent_ != nullptr) {
    auto& newContext = runtimeAgent_->getExecutionContextDescription();
    folly::dynamic params = folly::dynamic::object(
        "context",
        folly::dynamic::object("id", newContext.id)(
            "origin", newContext.origin)("name", newContext.name));
    if (newContext.uniqueId.has_value()) {
      params["uniqueId"] = *newContext.uniqueId;
    }
    folly::dynamic contextCreated = folly::dynamic::object(
        "method", "Runtime.executionContextCreated")("params", params);
    frontendChannel_(folly::toJson(contextCreated));
  }
}

} // namespace facebook::react::jsinspector_modern

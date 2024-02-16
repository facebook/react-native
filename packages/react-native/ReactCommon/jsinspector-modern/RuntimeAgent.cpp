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
    RuntimeTargetController& targetController,
    const ExecutionContextDescription& executionContextDescription,
    SessionState& sessionState,
    std::unique_ptr<RuntimeAgentDelegate> delegate)
    : frontendChannel_(std::move(frontendChannel)),
      targetController_(targetController),
      sessionState_(sessionState),
      delegate_(std::move(delegate)),
      executionContextDescription_(executionContextDescription) {
  for (auto& name : sessionState_.subscribedBindingNames) {
    targetController_.installBindingHandler(name);
  }
}

bool RuntimeAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (req.method == "Runtime.addBinding") {
    std::string bindingName = req.params["name"].getString();
    // TODO: Respect @cdp Runtime.addBinding's executionContextId and
    // executionContextName params.
    sessionState_.subscribedBindingNames.emplace(bindingName);

    targetController_.installBindingHandler(bindingName);

    folly::dynamic res = folly::dynamic::object("id", req.id)(
        "result", folly::dynamic::object());
    std::string json = folly::toJson(res);
    frontendChannel_(json);

    return true;
  }
  if (req.method == "Runtime.removeBinding") {
    sessionState_.subscribedBindingNames.erase(req.params["name"].getString());

    folly::dynamic res = folly::dynamic::object("id", req.id)(
        "result", folly::dynamic::object());
    std::string json = folly::toJson(res);
    frontendChannel_(json);

    return true;
  }
  if (delegate_) {
    return delegate_->handleRequest(req);
  }
  return false;
}

void RuntimeAgent::notifyBindingCalled(
    const std::string& bindingName,
    const std::string& payload) {
  if (!sessionState_.subscribedBindingNames.count(bindingName)) {
    return;
  }

  frontendChannel_(
      folly::toJson(folly::dynamic::object("method", "Runtime.bindingCalled")(
          "params",
          folly::dynamic::object(
              "executionContextId", executionContextDescription_.id)(
              "name", bindingName)("payload", payload))));
}

} // namespace facebook::react::jsinspector_modern

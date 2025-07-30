/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeAgent.h"
#include "SessionState.h"

#include <utility>

namespace facebook::react::jsinspector_modern {

RuntimeAgent::RuntimeAgent(
    FrontendChannel frontendChannel,
    RuntimeTargetController& targetController,
    ExecutionContextDescription executionContextDescription,
    SessionState& sessionState,
    std::unique_ptr<RuntimeAgentDelegate> delegate)
    : frontendChannel_(std::move(frontendChannel)),
      targetController_(targetController),
      sessionState_(sessionState),
      delegate_(std::move(delegate)),
      executionContextDescription_(std::move(executionContextDescription)) {
  for (auto& [name, contextSelectors] : sessionState_.subscribedBindings) {
    if (matchesAny(executionContextDescription_, contextSelectors)) {
      targetController_.installBindingHandler(name);
    }
  }

  if (sessionState_.isRuntimeDomainEnabled &&
      sessionState_.isLogDomainEnabled) {
    targetController_.notifyDebuggerSessionCreated();
  }
}

bool RuntimeAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (req.method == "Runtime.addBinding") {
    std::string bindingName = req.params["name"].getString();

    // Check if the binding has a context selector that matches the current
    // context. The state will have been updated by HostAgent by the time we
    // receive the request.
    // NOTE: We DON'T do the reverse for removeBinding, for reasons explained
    // in the implementation of HostAgent.
    auto it = sessionState_.subscribedBindings.find(bindingName);
    if (it != sessionState_.subscribedBindings.end()) {
      auto contextSelectors = it->second;
      if (matchesAny(executionContextDescription_, contextSelectors)) {
        targetController_.installBindingHandler(bindingName);
      }
    }

    // We are not responding to this request, just processing a side effect.
    return false;
  }
  if (req.method == "Runtime.enable" && sessionState_.isLogDomainEnabled) {
    targetController_.notifyDebuggerSessionCreated();
  }
  if (req.method == "Log.enable" && sessionState_.isRuntimeDomainEnabled) {
    targetController_.notifyDebuggerSessionCreated();
  }
  if (req.method == "Runtime.disable" && sessionState_.isLogDomainEnabled) {
    targetController_.notifyDebuggerSessionDestroyed();
  }
  if (req.method == "Log.disable" && sessionState_.isRuntimeDomainEnabled) {
    targetController_.notifyDebuggerSessionDestroyed();
  }
  if (delegate_) {
    return delegate_->handleRequest(req);
  }
  return false;
}

void RuntimeAgent::notifyBindingCalled(
    const std::string& bindingName,
    const std::string& payload) {
  // NOTE: When dispatching @cdp Runtime.bindingCalled notifications, we don't
  // re-check whether the session is expecting notifications from the current
  // context - only that it's subscribed to that binding name.
  // Theoretically, this can result in over-sending notifications from contexts
  // that the client no longer cares about, or never cared about to begin with
  // (e.g. if the binding handler was installed by a previous session).
  //
  // React Native intentionally replicates this behavior for the sake of
  // bug-for-bug compatibility with Chrome, but clients should probably not rely
  // on it.
  if (sessionState_.subscribedBindings.count(bindingName) == 0u) {
    return;
  }

  frontendChannel_(cdp::jsonNotification(
      "Runtime.bindingCalled",
      folly::dynamic::object(
          "executionContextId", executionContextDescription_.id)(
          "name", bindingName)("payload", payload)));
}

RuntimeAgent::ExportedState RuntimeAgent::getExportedState() {
  return {
      .delegateState = delegate_ ? delegate_->getExportedState() : nullptr,
  };
}

RuntimeAgent::~RuntimeAgent() {
  if (sessionState_.isRuntimeDomainEnabled &&
      sessionState_.isLogDomainEnabled) {
    targetController_.notifyDebuggerSessionDestroyed();
  }

  // TODO: Eventually, there may be more than one Runtime per Page, and we'll
  // need to store multiple agent states here accordingly. For now let's do
  // the simple thing and assume (as we do elsewhere) that only one Runtime
  // per Page can exist at a time.
  sessionState_.lastRuntimeAgentExportedState = getExportedState();
}

void RuntimeAgent::enableSamplingProfiler() {
  targetController_.enableSamplingProfiler();
}

void RuntimeAgent::disableSamplingProfiler() {
  targetController_.disableSamplingProfiler();
}

tracing::RuntimeSamplingProfile RuntimeAgent::collectSamplingProfile() {
  return targetController_.collectSamplingProfile();
}

} // namespace facebook::react::jsinspector_modern

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeAgent.h"
#include "SessionState.h"

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
  for (auto& [name, contextSelectors] : sessionState_.subscribedBindings) {
    if (matchesAny(executionContextDescription_, contextSelectors)) {
      targetController_.installBindingHandler(name);
    }
  }
}

bool RuntimeAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (req.method == "Runtime.addBinding") {
    std::string bindingName = req.params["name"].getString();

    ExecutionContextSelector contextSelector = ExecutionContextSelector::all();

    // TODO: Eventually, move execution context targeting out of RuntimeAgent.
    // Right now, there's only ever one context (Runtime) in a Page, so we can
    // handle it here for simplicity, and use session state to propagate
    // bindings to the next RuntimeAgent.
    if (req.params.count("executionContextId")) {
      auto executionContextId = req.params["executionContextId"].getInt();
      if (executionContextId < (int64_t)std::numeric_limits<int32_t>::min() ||
          executionContextId > (int64_t)std::numeric_limits<int32_t>::max()) {
        frontendChannel_(folly::toJson(folly::dynamic::object("id", req.id)(
            "error",
            folly::dynamic::object("code", -32602)(
                "message", "Invalid execution context id"))));
        return true;
      }
      contextSelector =
          ExecutionContextSelector::byId((int32_t)executionContextId);

      if (req.params.count("executionContextName")) {
        frontendChannel_(folly::toJson(folly::dynamic::object("id", req.id)(
            "error",
            folly::dynamic::object("code", -32602)(
                "message",
                "executionContextName is mutually exclusive with executionContextId"))));
        return true;
      }
    } else if (req.params.count("executionContextName")) {
      contextSelector = ExecutionContextSelector::byName(
          req.params["executionContextName"].getString());
    }
    if (contextSelector.matches(executionContextDescription_)) {
      targetController_.installBindingHandler(bindingName);
    }
    sessionState_.subscribedBindings[bindingName].insert(contextSelector);

    folly::dynamic res = folly::dynamic::object("id", req.id)(
        "result", folly::dynamic::object());
    std::string json = folly::toJson(res);
    frontendChannel_(json);

    return true;
  }
  if (req.method == "Runtime.removeBinding") {
    // @cdp Runtime.removeBinding has no targeting by execution context. We
    // interpret it to mean "unsubscribe, and stop installing the binding on
    // all new contexts". This diverges slightly from V8, which continues
    // to install the binding on new contexts after it's "removed", but *only*
    // if the subscription is targeted by context name.
    sessionState_.subscribedBindings.erase(req.params["name"].getString());

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
  if (!sessionState_.subscribedBindings.count(bindingName)) {
    return;
  }

  frontendChannel_(
      folly::toJson(folly::dynamic::object("method", "Runtime.bindingCalled")(
          "params",
          folly::dynamic::object(
              "executionContextId", executionContextDescription_.id)(
              "name", bindingName)("payload", payload))));
}

RuntimeAgent::ExportedState RuntimeAgent::getExportedState() {
  return {
      .delegateState = delegate_ ? delegate_->getExportedState() : nullptr,
  };
}

RuntimeAgent::~RuntimeAgent() {
  // TODO: Eventually, there may be more than one Runtime per Page, and we'll
  // need to store multiple agent states here accordingly. For now let's do
  // the simple thing and assume (as we do elsewhere) that only one Runtime
  // per Page can exist at a time.
  sessionState_.lastRuntimeAgentExportedState = getExportedState();
}

} // namespace facebook::react::jsinspector_modern

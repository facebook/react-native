/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SessionState.h"

#include <jsinspector-modern/RuntimeTarget.h>
#include <jsinspector-modern/tracing/PerformanceTracer.h>

#include <utility>

using namespace facebook::jsi;

namespace facebook::react::jsinspector_modern {

namespace {

void emitSessionStatusChangeForObserverWithValue(
    jsi::Runtime& runtime,
    const jsi::Value& value) {
  auto globalObj = runtime.global();
  auto observer =
      globalObj.getPropertyAsObject(runtime, "__DEBUGGER_SESSION_OBSERVER__");
  auto onSessionStatusChange =
      observer.getPropertyAsFunction(runtime, "onSessionStatusChange");
  onSessionStatusChange.call(runtime, value);
}

} // namespace

std::shared_ptr<RuntimeTarget> RuntimeTarget::create(
    const ExecutionContextDescription& executionContextDescription,
    RuntimeTargetDelegate& delegate,
    RuntimeExecutor jsExecutor,
    VoidExecutor selfExecutor) {
  std::shared_ptr<RuntimeTarget> runtimeTarget{new RuntimeTarget(
      executionContextDescription, delegate, std::move(jsExecutor))};
  runtimeTarget->setExecutor(std::move(selfExecutor));
  runtimeTarget->installGlobals();
  return runtimeTarget;
}

RuntimeTarget::RuntimeTarget(
    ExecutionContextDescription executionContextDescription,
    RuntimeTargetDelegate& delegate,
    RuntimeExecutor jsExecutor)
    : executionContextDescription_(std::move(executionContextDescription)),
      delegate_(delegate),
      jsExecutor_(std::move(jsExecutor)) {}

void RuntimeTarget::installGlobals() {
  // NOTE: RuntimeTarget::installConsoleHandler is in RuntimeTargetConsole.cpp
  installConsoleHandler();
  // NOTE: RuntimeTarget::installDebuggerSessionObserver is in
  // RuntimeTargetDebuggerSessionObserver.cpp
  installDebuggerSessionObserver();
  // NOTE: RuntimeTarget::installNetworkReporterAPI is in
  // RuntimeTargetNetwork.cpp
  installNetworkReporterAPI();
}

std::shared_ptr<RuntimeAgent> RuntimeTarget::createAgent(
    const FrontendChannel& channel,
    SessionState& sessionState) {
  auto runtimeAgentState =
      std::move(sessionState.lastRuntimeAgentExportedState);
  auto runtimeAgent = std::make_shared<RuntimeAgent>(
      channel,
      controller_,
      executionContextDescription_,
      sessionState,
      delegate_.createAgentDelegate(
          channel,
          sessionState,
          std::move(runtimeAgentState.delegateState),
          executionContextDescription_,
          jsExecutor_));
  agents_.insert(runtimeAgent);
  return runtimeAgent;
}

std::shared_ptr<RuntimeTracingAgent> RuntimeTarget::createTracingAgent(
    tracing::TraceRecordingState& state) {
  auto agent = std::make_shared<RuntimeTracingAgent>(state, controller_);
  tracingAgent_ = agent;
  return agent;
}

RuntimeTarget::~RuntimeTarget() {
  // Agents are owned by the session, not by RuntimeTarget, but
  // they hold a RuntimeTarget& that we must guarantee is valid.
  assert(
      agents_.empty() &&
      "RuntimeAgent objects must be destroyed before their RuntimeTarget. Did you call InstanceTarget::unregisterRuntime()?");

  // Tracing Agents are owned by the HostTargetTraceRecording.
  assert(
      tracingAgent_.expired() &&
      "RuntimeTracingAgent must be destroyed before their InstanceTarget. Did you call InstanceTarget::unregisterRuntime()?");
}

void RuntimeTarget::installBindingHandler(const std::string& bindingName) {
  jsExecutor_([bindingName,
               selfExecutor = executorFromThis()](jsi::Runtime& runtime) {
    auto globalObj = runtime.global();
    try {
      auto bindingNamePropID = jsi::PropNameID::forUtf8(runtime, bindingName);
      globalObj.setProperty(
          runtime,
          bindingNamePropID,
          jsi::Function::createFromHostFunction(
              runtime,
              bindingNamePropID,
              1,
              [bindingName, selfExecutor](
                  jsi::Runtime& rt,
                  const jsi::Value&,
                  const jsi::Value* args,
                  size_t count) -> jsi::Value {
                if (count != 1 || !args[0].isString()) {
                  throw jsi::JSError(
                      rt, "Invalid arguments: should be exactly one string.");
                }
                std::string payload = args[0].getString(rt).utf8(rt);

                selfExecutor([bindingName, payload](auto& self) {
                  self.agents_.forEach([bindingName, payload](auto& agent) {
                    agent.notifyBindingCalled(bindingName, payload);
                  });
                });

                return jsi::Value::undefined();
              }));
    } catch (jsi::JSError&) {
      // Per Chrome's implementation, @cdp Runtime.createBinding swallows
      // JavaScript exceptions that occur while setting up the binding.
    }
  });
}

void RuntimeTarget::emitDebuggerSessionCreated() {
  jsExecutor_([selfExecutor = executorFromThis()](jsi::Runtime& runtime) {
    try {
      emitSessionStatusChangeForObserverWithValue(runtime, jsi::Value(true));
    } catch (jsi::JSError&) {
      // Suppress any errors, they should not be visible to the user
      // and should not affect runtime.
    }
  });
}

void RuntimeTarget::emitDebuggerSessionDestroyed() {
  jsExecutor_([selfExecutor = executorFromThis()](jsi::Runtime& runtime) {
    try {
      emitSessionStatusChangeForObserverWithValue(runtime, jsi::Value(false));
    } catch (jsi::JSError&) {
      // Suppress any errors, they should not be visible to the user
      // and should not affect runtime.
    }
  });
}

void RuntimeTarget::enableSamplingProfiler() {
  delegate_.enableSamplingProfiler();
}

void RuntimeTarget::disableSamplingProfiler() {
  delegate_.disableSamplingProfiler();
}

tracing::RuntimeSamplingProfile RuntimeTarget::collectSamplingProfile() {
  return delegate_.collectSamplingProfile();
}

void RuntimeTarget::notifyDomainStateChanged(
    Domain domain,
    bool enabled,
    const RuntimeAgent& notifyingAgent) {
  auto [domainStateChangedLocally, domainStateChangedGlobally] =
      processDomainChange(domain, enabled, notifyingAgent);

  switch (domain) {
    case Domain::Log:
    case Domain::Runtime: {
      auto otherDomain = domain == Domain::Log ? Domain::Runtime : Domain::Log;
      // There should be an agent that enables both Log and Runtime domains.
      if (!agentsByEnabledDomain_[otherDomain].contains(&notifyingAgent)) {
        break;
      }

      if (domainStateChangedGlobally && enabled) {
        assert(agentsWithRuntimeAndLogDomainsEnabled_ == 0);
        emitDebuggerSessionCreated();
        ++agentsWithRuntimeAndLogDomainsEnabled_;
      } else if (domainStateChangedGlobally) {
        assert(agentsWithRuntimeAndLogDomainsEnabled_ == 1);
        emitDebuggerSessionDestroyed();
        --agentsWithRuntimeAndLogDomainsEnabled_;
      } else if (domainStateChangedLocally && enabled) {
        // This is a case when given domain was already enabled by other Agent,
        // so global state didn't change.
        if (++agentsWithRuntimeAndLogDomainsEnabled_ == 1) {
          emitDebuggerSessionCreated();
        }
      } else if (domainStateChangedLocally) {
        if (--agentsWithRuntimeAndLogDomainsEnabled_ == 0) {
          emitDebuggerSessionDestroyed();
        }
      }

      break;
    }
    case Domain::Network:
      break;
    case Domain::kMaxValue: {
      throw std::logic_error("Unexpected kMaxValue domain value provided");
    }
  }
}

std::pair<bool, bool> RuntimeTarget::processDomainChange(
    Domain domain,
    bool enabled,
    const RuntimeAgent& notifyingAgent) {
  bool domainHadAgentsBefore = !agentsByEnabledDomain_[domain].empty();
  bool domainHasBeenEnabledBefore =
      agentsByEnabledDomain_[domain].contains(&notifyingAgent);

  if (enabled) {
    agentsByEnabledDomain_[domain].insert(&notifyingAgent);
  } else {
    agentsByEnabledDomain_[domain].erase(&notifyingAgent);
  }
  threadSafeDomainStatus_[domain] = !agentsByEnabledDomain_[domain].empty();

  bool domainHasAgentsAfter = !agentsByEnabledDomain_[domain].empty();

  return {
      domainHasBeenEnabledBefore ^ enabled,
      domainHadAgentsBefore ^ domainHasAgentsAfter,
  };
}

bool RuntimeTarget::isDomainEnabled(Domain domain) const {
  return threadSafeDomainStatus_[domain];
}

RuntimeTargetController::RuntimeTargetController(RuntimeTarget& target)
    : target_(target) {}

void RuntimeTargetController::installBindingHandler(
    const std::string& bindingName) {
  target_.installBindingHandler(bindingName);
}

void RuntimeTargetController::enableSamplingProfiler() {
  target_.enableSamplingProfiler();
}

void RuntimeTargetController::disableSamplingProfiler() {
  target_.disableSamplingProfiler();
}

tracing::RuntimeSamplingProfile
RuntimeTargetController::collectSamplingProfile() {
  return target_.collectSamplingProfile();
}

void RuntimeTargetController::notifyDomainStateChanged(
    Domain domain,
    bool enabled,
    const RuntimeAgent& notifyingAgent) {
  target_.notifyDomainStateChanged(domain, enabled, notifyingAgent);
}

} // namespace facebook::react::jsinspector_modern

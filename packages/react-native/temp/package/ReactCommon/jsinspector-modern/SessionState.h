/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ExecutionContext.h"
#include "RuntimeAgent.h"

#include <string>
#include <string_view>
#include <unordered_map>
#include <unordered_set>

namespace facebook::react::jsinspector_modern {

struct SessionState {
 public:
  // TODO: Generalise this to arbitrary domains
  bool isDebuggerDomainEnabled{false};
  bool isLogDomainEnabled{false};
  bool isReactNativeApplicationDomainEnabled{false};
  bool isRuntimeDomainEnabled{false};

  /**
   * A map from binding names (registered during this session using @cdp
   * Runtime.addBinding) to execution context selectors.
   *
   * Even though bindings get added to the global scope as
   * functions that can outlive a session, they are treated as session state,
   * matching Chrome's behaviour (a binding not added by the current session
   * will not emit events on it).
   */
  std::unordered_map<std::string, ExecutionContextSelectorSet>
      subscribedBindings;

  /**
   * Messages logged through the HostAgent::sendConsoleMessage and
   * InstanceAgent::sendConsoleMessage utilities that have not yet been sent to
   * the frontend.
   * \note This is unrelated to RuntimeTarget's user-facing console API
   * implementation, which depends on access to JSI and support from the
   * RuntimeTargetDelegate.
   */
  std::vector<SimpleConsoleMessage> pendingSimpleConsoleMessages;

  /**
   * Stores the state object exported from the last main RuntimeAgent, if any,
   * before it was destroyed.
   */
  RuntimeAgent::ExportedState lastRuntimeAgentExportedState;

  // Here, we will eventually allow RuntimeAgents to store their own arbitrary
  // state (e.g. some sort of K/V storage of folly::dynamic?)

  // TODO: Figure out a good model for restricting write access / preventing
  // agents from unintentionally clobbering each other's state.
};

} // namespace facebook::react::jsinspector_modern

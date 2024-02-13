/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InspectorInterfaces.h"
#include "RuntimeAgentDelegate.h"
#include "RuntimeTarget.h"
#include "SessionState.h"

#include <jsinspector-modern/Parsing.h>

namespace facebook::react::jsinspector_modern {

class RuntimeTarget;

/**
 * An Agent that handles requests from the Chrome DevTools Protocol
 * for a particular JS runtime instance. RuntimeAgent implements
 * engine-agnostic functionality based on interfaces available in JSI /
 * RuntimeTarget, and delegates engine-specific functionality to a
 * RuntimeAgentDelegate.
 */
class RuntimeAgent final {
 public:
  /**
   * \param frontendChannel A channel used to send responses and events to the
   * frontend.
   * \param target The RuntimeTarget that this agent is attached to. The
   * caller is responsible for ensuring that the RuntimeTarget outlives this
   * object.
   * \param sessionState The state of the session that created this agent.
   * \param delegate The RuntimeAgentDelegate providing engine-specific
   * CDP functionality.
   */
  RuntimeAgent(
      FrontendChannel frontendChannel,
      RuntimeTarget& target,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate> delegate);

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously. Performs any
   * synchronization required between the thread on which this method is
   * called and the thread where the JS runtime is executing.
   * \param req The parsed request.
   * \returns true if this agent has responded, or will respond asynchronously,
   * to the request (with either a success or error message). False if the
   * agent expects another agent to respond to the request instead.
   */
  bool handleRequest(const cdp::PreparsedRequest& req);

 private:
  FrontendChannel frontendChannel_;
  RuntimeTarget& target_;
  SessionState& sessionState_;
  const std::unique_ptr<RuntimeAgentDelegate> delegate_;
};

} // namespace facebook::react::jsinspector_modern

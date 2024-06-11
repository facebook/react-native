/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "HostTarget.h"
#include "SessionState.h"

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/InstanceAgent.h>

#include <functional>
#include <string_view>

namespace facebook::react::jsinspector_modern {

class HostTarget;
class InstanceAgent;
class InstanceTarget;

/**
 * An Agent that handles requests from the Chrome DevTools Protocol for the
 * given Host.
 * The constructor, destructor and all public methods must be called on the
 * same thread, which is also the thread where the associated HostTarget is
 * constructed and managed.
 */
class HostAgent final {
 public:
  /**
   * \param frontendChannel A channel used to send responses and events to the
   * frontend.
   * \param targetController An interface to the HostTarget that this agent is
   * attached to. The caller is responsible for ensuring that the
   * HostTargetDelegate and underlying HostTarget both outlive the agent.
   * \param hostMetadata Metadata about the host that created this agent.
   * \param sessionState The state of the session that created this agent.
   */
  HostAgent(
      FrontendChannel frontendChannel,
      HostTargetController& targetController,
      HostTargetMetadata hostMetadata,
      SessionState& sessionState);

  HostAgent(const HostAgent&) = delete;
  HostAgent(HostAgent&&) = delete;
  HostAgent& operator=(const HostAgent&) = delete;
  HostAgent& operator=(HostAgent&&) = delete;

  ~HostAgent();

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   */
  void handleRequest(const cdp::PreparsedRequest& req);

  /**
   * Replace the current InstanceAgent with the given one and notify the
   * frontend about the new instance.
   * \param agent The new InstanceAgent. May be null to signify that there is
   * currently no active instance.
   */
  void setCurrentInstanceAgent(std::shared_ptr<InstanceAgent> agent);

 private:
  enum class FuseboxClientType { Unknown, Fusebox, NonFusebox };

  /**
   * Send a simple Log.entryAdded notification with the given
   * \param text. You must ensure that the frontend has enabled Log
   * notifications (using Log.enable) prior to calling this function. In Chrome
   * DevTools, the message will appear in the Console tab along with regular
   * console messages. The difference between Log.entryAdded and
   * Runtime.consoleAPICalled is that the latter requires an execution context
   * ID, which does not exist at the Host level.
   */
  void sendInfoLogEntry(
      std::string_view text,
      std::initializer_list<std::string_view> args = {});

  void sendFuseboxNotice();
  void sendNonFuseboxNotice();

  /**
   * Send a console message to the frontend, or buffer it to be sent later.
   */
  void sendConsoleMessage(SimpleConsoleMessage message);

  FrontendChannel frontendChannel_;
  HostTargetController& targetController_;
  const HostTargetMetadata hostMetadata_;
  std::shared_ptr<InstanceAgent> instanceAgent_;
  FuseboxClientType fuseboxClientType_{FuseboxClientType::Unknown};
  bool isPausedInDebuggerOverlayVisible_{false};

  /**
   * A shared reference to the session's state. This is only safe to access
   * during handleRequest and other method calls on the same thread.
   */
  SessionState& sessionState_;
};

} // namespace facebook::react::jsinspector_modern

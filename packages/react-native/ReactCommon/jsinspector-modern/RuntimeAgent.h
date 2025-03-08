/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "CdpJson.h"
#include "InspectorInterfaces.h"
#include "RuntimeAgentDelegate.h"
#include "RuntimeTarget.h"

#include <jsinspector-modern/tracing/RuntimeSamplingProfile.h>

namespace facebook::react::jsinspector_modern {

class RuntimeTargetController;
struct SessionState;

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
   * \param targetController An interface to the RuntimeTarget that this agent
   * is attached to. The caller is responsible for ensuring that the
   * RuntimeTarget and controller outlive this object.
   * \param executionContextDescription A description of the execution context
   * represented by this runtime. This is used for disambiguating the
   * source/destination of CDP messages when there are multiple runtimes
   * (concurrently or over the life of a Host).
   * \param sessionState The state of the session that created this agent.
   * \param delegate The RuntimeAgentDelegate providing engine-specific
   * CDP functionality.
   */
  RuntimeAgent(
      FrontendChannel frontendChannel,
      RuntimeTargetController& targetController,
      const ExecutionContextDescription& executionContextDescription,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate> delegate);

  ~RuntimeAgent();

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

  inline const ExecutionContextDescription& getExecutionContextDescription()
      const {
    return executionContextDescription_;
  }

  void notifyBindingCalled(
      const std::string& bindingName,
      const std::string& payload);

  struct ExportedState {
    std::unique_ptr<RuntimeAgentDelegate::ExportedState> delegateState;
  };

  /**
   * Export the RuntimeAgent's state, if available. This will be called
   * shortly before the RuntimeAgent is destroyed to preserve state that may be
   * needed when constructin a new RuntimeAgent.
   */
  ExportedState getExportedState();

  /**
   * Registers the corresponding RuntimeTarget for Tracing: might enable some
   * capabilities that will be later used in Tracing Profile.
   */
  void registerForTracing();

  /**
   * Start sampling profiler for the corresponding RuntimeTarget.
   */
  void enableSamplingProfiler();

  /**
   * Stop sampling profiler for the corresponding RuntimeTarget.
   */
  void disableSamplingProfiler();

  /**
   * Return recorded sampling profile for the previous sampling session.
   */
  tracing::RuntimeSamplingProfile collectSamplingProfile();

 private:
  FrontendChannel frontendChannel_;
  RuntimeTargetController& targetController_;
  SessionState& sessionState_;
  const std::unique_ptr<RuntimeAgentDelegate> delegate_;
  const ExecutionContextDescription executionContextDescription_;
};

} // namespace facebook::react::jsinspector_modern

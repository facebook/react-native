/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include "InspectorInterfaces.h"
#include "RuntimeAgent.h"
#include "SessionState.h"

#include <list>
#include <memory>

#ifndef JSINSPECTOR_EXPORT
#ifdef _MSC_VER
#ifdef CREATE_SHARED_LIBRARY
#define JSINSPECTOR_EXPORT __declspec(dllexport)
#else
#define JSINSPECTOR_EXPORT
#endif // CREATE_SHARED_LIBRARY
#else // _MSC_VER
#define JSINSPECTOR_EXPORT __attribute__((visibility("default")))
#endif // _MSC_VER
#endif // !defined(JSINSPECTOR_EXPORT)

namespace facebook::react::jsinspector_modern {

class RuntimeAgent;
class RuntimeAgentDelegate;

/**
 * Receives events from a RuntimeTarget. This is a shared interface that
 * each React Native platform needs to implement in order to integrate with
 * the debugging stack.
 */
class RuntimeTargetDelegate {
 public:
  virtual ~RuntimeTargetDelegate() = default;
  virtual std::unique_ptr<RuntimeAgentDelegate> createAgentDelegate(
      FrontendChannel channel,
      SessionState& sessionState) = 0;
};

/**
 * A Target corresponding to a JavaScript runtime.
 */
class JSINSPECTOR_EXPORT RuntimeTarget final {
 public:
  /**
   * \param delegate The object that will receive events from this target.
   * The caller is responsible for ensuring that the delegate outlives this
   * object.
   * \param executor A RuntimeExecutor that can be used to schedule work on
   * the JS runtime's thread. The executor's queue should be empty when
   * RuntimeTarget is constructed (i.e. anything scheduled during the
   * constructor should be executed before any user code is run).
   */
  RuntimeTarget(RuntimeTargetDelegate& delegate, RuntimeExecutor executor);

  RuntimeTarget(const RuntimeTarget&) = delete;
  RuntimeTarget(RuntimeTarget&&) = delete;
  RuntimeTarget& operator=(const RuntimeTarget&) = delete;
  RuntimeTarget& operator=(RuntimeTarget&&) = delete;
  ~RuntimeTarget();

  /**
   * Create a new RuntimeAgent that can be used to debug the underlying JS VM.
   * The agent will be destroyed when the session ends, the containing
   * InstanceTarget is unregistered from its PageTarget, or the RuntimeAgent is
   * unregistered from its InstanceTarget (whichever happens first).
   * \param channel A thread-safe channel for sending CDP messages to the
   * frontend.
   * \returns The new agent, or nullptr if the runtime is not debuggable.
   */
  std::shared_ptr<RuntimeAgent> createAgent(
      FrontendChannel channel,
      SessionState& sessionState);

 private:
  RuntimeTargetDelegate& delegate_;
  RuntimeExecutor executor_;
  std::list<std::weak_ptr<RuntimeAgent>> agents_;

  /**
   * Call the given function for every active agent, and clean up any
   * references to inactive agents.
   */
  template <typename Fn>
  void forEachAgent(Fn&& fn) {
    for (auto it = agents_.begin(); it != agents_.end();) {
      if (auto agent = it->lock()) {
        fn(*agent);
        ++it;
      } else {
        it = agents_.erase(it);
      }
    }
  }

  void removeExpiredAgents();
};

} // namespace facebook::react::jsinspector_modern

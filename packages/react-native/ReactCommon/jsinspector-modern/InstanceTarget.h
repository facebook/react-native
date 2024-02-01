/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "SessionState.h"

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/RuntimeAgent.h>

#include <list>
#include <memory>
#include <optional>

namespace facebook::react::jsinspector_modern {

class InstanceAgent;

/**
 * Receives events from an InstanceTarget. This is a shared interface that
 * each React Native platform needs to implement in order to integrate with
 * the debugging stack.
 */
class InstanceTargetDelegate {
 public:
  InstanceTargetDelegate() = default;
  InstanceTargetDelegate(const InstanceTargetDelegate&) = delete;
  InstanceTargetDelegate(InstanceTargetDelegate&&) = default;
  InstanceTargetDelegate& operator=(const InstanceTargetDelegate&) = delete;
  InstanceTargetDelegate& operator=(InstanceTargetDelegate&&) = default;

  /**
   * Create a new RuntimeAgent that can be used to debug the underlying JS VM.
   * The agent will be destroyed when the session ends or the InstanceTarget is
   * unregistered from its PageTarget (whichever happens first).
   * \param channel A thread-safe channel for sending CDP messages to the
   * frontend.
   * \returns The new agent, or nullptr if the target does not support JS
   * debugging.
   */
  virtual std::unique_ptr<RuntimeAgent> createRuntimeAgent(
      FrontendChannel channel,
      SessionState& sessionState) = 0;
  virtual ~InstanceTargetDelegate();
};

/**
 * A Target that represents a single instance of React Native.
 */
class InstanceTarget {
 public:
  /**
   * \param delegate The object that will receive events from this target.
   * The caller is responsible for ensuring that the delegate outlives this
   * object.
   */
  explicit InstanceTarget(InstanceTargetDelegate& delegate);

  InstanceTarget(const InstanceTarget&) = delete;
  InstanceTarget(InstanceTarget&&) = delete;
  InstanceTarget& operator=(const InstanceTarget&) = delete;
  InstanceTarget& operator=(InstanceTarget&&) = delete;

  std::unique_ptr<InstanceAgent> createAgent(
      FrontendChannel channel,
      SessionState& sessionState);

 private:
  InstanceTargetDelegate& delegate_;
};

} // namespace facebook::react::jsinspector_modern

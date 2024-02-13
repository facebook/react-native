/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InspectorInterfaces.h"
#include "RuntimeAgent.h"
#include "SessionState.h"

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

/**
 * Receives events from a RuntimeTarget. This is a shared interface that
 * each React Native platform needs to implement in order to integrate with
 * the debugging stack.
 */
class RuntimeTargetDelegate {
 public:
  virtual ~RuntimeTargetDelegate() = default;
  virtual std::unique_ptr<RuntimeAgent> createAgent(
      FrontendChannel channel,
      SessionState& sessionState) = 0;
};

/**
 * A Target corresponding to a JavaScript runtime.
 */
class JSINSPECTOR_EXPORT RuntimeTarget {
 public:
  /**
   * \param delegate The object that will receive events from this target.
   * The caller is responsible for ensuring that the delegate outlives this
   * object.
   */
  explicit RuntimeTarget(RuntimeTargetDelegate& delegate);

  RuntimeTarget(const RuntimeTarget&) = delete;
  RuntimeTarget(RuntimeTarget&&) = delete;
  RuntimeTarget& operator=(const RuntimeTarget&) = delete;
  RuntimeTarget& operator=(RuntimeTarget&&) = delete;

  /**
   * Create a new RuntimeAgent that can be used to debug the underlying JS VM.
   * The agent will be destroyed when the session ends, the containing
   * InstanceTarget is unregistered from its PageTarget, or the RuntimeAgent is
   * unregistered from its InstanceTarget (whichever happens first).
   * \param channel A thread-safe channel for sending CDP messages to the
   * frontend.
   * \returns The new agent, or nullptr if the runtime is not debuggable.
   */
  std::unique_ptr<RuntimeAgent> createAgent(
      FrontendChannel channel,
      SessionState& sessionState);

 private:
  RuntimeTargetDelegate& delegate_;
};

} // namespace facebook::react::jsinspector_modern

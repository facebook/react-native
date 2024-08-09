/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ExecutionContextManager.h"
#include "RuntimeTarget.h"
#include "ScopedExecutor.h"
#include "SessionState.h"
#include "WeakList.h"

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

  virtual ~InstanceTargetDelegate();
};

/**
 * A Target that represents a single instance of React Native.
 */
class InstanceTarget : public EnableExecutorFromThis<InstanceTarget> {
 public:
  /**
   * Constructs a new InstanceTarget.
   * \param executionContextManager Assigns unique execution context IDs.
   * \param delegate The object that will receive events from this target.
   * The caller is responsible for ensuring that the delegate outlives this
   * object.
   * \param executor An executor that may be used to call methods on this
   * InstanceTarget while it exists. \c create additionally guarantees that the
   * executor will not be called after the InstanceTarget is destroyed.
   */
  static std::shared_ptr<InstanceTarget> create(
      std::shared_ptr<ExecutionContextManager> executionContextManager,
      InstanceTargetDelegate& delegate,
      VoidExecutor executor);

  InstanceTarget(const InstanceTarget&) = delete;
  InstanceTarget(InstanceTarget&&) = delete;
  InstanceTarget& operator=(const InstanceTarget&) = delete;
  InstanceTarget& operator=(InstanceTarget&&) = delete;
  ~InstanceTarget();

  std::shared_ptr<InstanceAgent> createAgent(
      FrontendChannel channel,
      SessionState& sessionState);

  RuntimeTarget& registerRuntime(
      RuntimeTargetDelegate& delegate,
      RuntimeExecutor executor);
  void unregisterRuntime(RuntimeTarget& runtime);

 private:
  /**
   * Constructs a new InstanceTarget. The caller must call setExecutor
   * immediately afterwards.
   * \param executionContextManager Assigns unique execution context IDs.
   * \param delegate The object that will receive events from this target.
   * The caller is responsible for ensuring that the delegate outlives this
   * object.
   */
  InstanceTarget(
      std::shared_ptr<ExecutionContextManager> executionContextManager,
      InstanceTargetDelegate& delegate);

  InstanceTargetDelegate& delegate_;
  std::shared_ptr<RuntimeTarget> currentRuntime_{nullptr};
  WeakList<InstanceAgent> agents_;
  std::shared_ptr<ExecutionContextManager> executionContextManager_;
};

} // namespace facebook::react::jsinspector_modern

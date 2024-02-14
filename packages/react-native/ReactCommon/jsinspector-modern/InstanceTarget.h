/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "RuntimeTarget.h"
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

  virtual ~InstanceTargetDelegate();
};

/**
 * A Target that represents a single instance of React Native.
 */
class InstanceTarget final {
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
  ~InstanceTarget();

  std::shared_ptr<InstanceAgent> createAgent(
      FrontendChannel channel,
      SessionState& sessionState);

  RuntimeTarget& registerRuntime(
      RuntimeTargetDelegate& delegate,
      RuntimeExecutor executor);
  void unregisterRuntime(RuntimeTarget& runtime);

 private:
  InstanceTargetDelegate& delegate_;
  std::optional<RuntimeTarget> currentRuntime_{std::nullopt};
  std::list<std::weak_ptr<InstanceAgent>> agents_;

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

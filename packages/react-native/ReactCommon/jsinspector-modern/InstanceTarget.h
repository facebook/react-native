/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsinspector-modern/InspectorInterfaces.h>

#include <list>
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

  std::unique_ptr<InstanceAgent> createAgent(FrontendChannel channel);

 private:
  InstanceTargetDelegate& delegate_;
};

} // namespace facebook::react::jsinspector_modern

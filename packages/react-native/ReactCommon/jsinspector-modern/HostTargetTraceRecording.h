/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "HostAgent.h"
#include "HostTarget.h"
#include "InstanceTarget.h"

#include <jsinspector-modern/tracing/TraceRecordingState.h>

#include <optional>

namespace facebook::react::jsinspector_modern {

/**
 * A local representation of the Tracing "session".
 *
 * Owned by the HostTarget and should only be allocated during an active
 * recording.
 *
 * Owns all allocated Tracing Agents. A single Target can have a single active
 * Tracing Agent, but only as a std::weak_ptr.
 */
class HostTargetTraceRecording {
 public:
  explicit HostTargetTraceRecording(
      tracing::Mode tracingMode,
      HostTarget& hostTarget);

  inline bool isBackgroundInitiated() const {
    return tracingMode_ == tracing::Mode::Background;
  }

  inline bool isUserInitiated() const {
    return tracingMode_ == tracing::Mode::CDP;
  }

  /**
   * Updates the current traced Instance for this recording.
   */
  void setTracedInstance(InstanceTarget* instanceTarget);

  /**
   * Starts the recording.
   *
   * Will allocate all Tracing Agents for all currently registered Targets.
   */
  void start();

  /**
   * Stops the recording and drops the recording state.
   *
   * Will deallocate all Tracing Agents.
   */
  tracing::TraceRecordingState stop();

 private:
  /**
   * The mode in which this trace recording was initialized.
   */
  tracing::Mode tracingMode_;

  /**
   * The Host for which this Trace Recording is going to happen.
   */
  HostTarget& hostTarget_;

  /**
   * The state of the current Trace Recording.
   * Only allocated if the recording is enabled.
   */
  std::optional<tracing::TraceRecordingState> state_;

  /**
   * The TracingAgent of the targeted Host.
   * Only allocated if the recording is enabled.
   */
  std::shared_ptr<HostTracingAgent> hostTracingAgent_;
};

} // namespace facebook::react::jsinspector_modern
